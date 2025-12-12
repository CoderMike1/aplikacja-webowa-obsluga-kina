from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from movies.serializers import GenreSerializer, MovieReadSerializer
from auditorium.serializers import AuditoriumReadSerializer
from movies.models import Movie
from auditorium.models import Auditorium
from .models import ProjectionType, Screening


class ProjectionTypeSerializer(serializers.ModelSerializer):
    # Prosty serializer typu projekcji (np. 2D/3D)
    class Meta:
        model = ProjectionType
        fields = ['id', 'name']


class ScreeningGroupedListSerializer(serializers.ListSerializer):
    # ListSerializer grupujący seanse według filmu i typu projekcji
    # Zwraca strukturę: [{ movie, projection_types: [{ projection_type, screenings: [...] }] }]
    def to_representation(self, data):
        items = list(data)
        groups = {}
        order = []
        dtfield = serializers.DateTimeField()

        for screening in items:
            movie = screening.movie
            mid = movie.pk
            if mid not in groups:
                groups[mid] = {
                    'movie': MovieReadSerializer(movie, context=self.context).data,
                    'projection_types': {},
                    '_proj_order': []
                }
                order.append(mid)

            p = screening.projection_type
            pid = p.pk if p is not None else '__none__'
            if pid not in groups[mid]['projection_types']:
                groups[mid]['projection_types'][pid] = {
                    'projection_type': p.name if p is not None else None,
                    'screenings': []
                }
                groups[mid]['_proj_order'].append(pid)

            groups[mid]['projection_types'][pid]['screenings'].append({
                'id': screening.pk,
                'auditorium': AuditoriumReadSerializer(screening.auditorium, context=self.context).data,
                'published_at': dtfield.to_representation(screening.published_at),
                'start_time': dtfield.to_representation(screening.start_time),
                'created_at': dtfield.to_representation(screening.created_at),
                'updated_at': dtfield.to_representation(screening.updated_at),
            })

        result = []
        for mid in order:
            movie_entry = {'movie': groups[mid]['movie'], 'projection_types': []}
            for pid in groups[mid]['_proj_order']:
                movie_entry['projection_types'].append(groups[mid]['projection_types'][pid])
            result.append(movie_entry)
        return result


class ScreeningReadSerializer(serializers.ModelSerializer):
    # Odczyt pojedynczego seansu (używany też przy odpowiedzi po utworzeniu)
    movie = MovieReadSerializer(read_only=True)  # powiązany film
    auditorium = AuditoriumReadSerializer(read_only=True)  # powiązana sala
    genres = GenreSerializer(source='movie.genres', many=True, read_only=True)  # gatunki filmu
    projection_type = ProjectionTypeSerializer(read_only=True)  # typ projekcji

    class Meta:
        model = Screening
        list_serializer_class = ScreeningGroupedListSerializer
        fields = [
            'id',
            'movie',
            'auditorium',
            'published_at',
            'start_time',
            'genres',
            'projection_type',
            'created_at',
            'updated_at',
        ]
    
class ScreeningWriteSerializer(serializers.ModelSerializer):
    # Pola wejściowe do tworzenia seansu (FK po id)
    movie_id = serializers.PrimaryKeyRelatedField(
        queryset=Movie.objects.all(), source='movie', write_only=True, required=True
    )
    auditorium_id = serializers.PrimaryKeyRelatedField(
        queryset=Auditorium.objects.all(), source='auditorium', write_only=True, required=True
    )
    projection_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectionType.objects.all(), source='projection_type', write_only=True, required=False, allow_null=True
    )
    # Jeśli nie podano published_at, ustaw domyślnie teraz; dopuszczamy też None w payloadzie
    # (wtedy validate_published_at zamieni None na teraz)
    published_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)
    procjection_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectionType.objects.all(), source='projection_type', write_only=True, required=False, allow_null=False)

    class Meta:
        model = Screening
        fields = [
            'id',
            'movie_id',
            'auditorium_id',
            'start_time',
            'published_at',
            'projection_type_id',
        ]
        read_only_fields = ['id']

    def validate_start_time(self, value):
        # Walidacja start_time:
        # 1) dozwolone tylko pełne godziny i/lub minuty co 10 (0,10,20,30,40,50)
        # 2) sekundy i mikrosekundy muszą być równe 0
        # 3) czas musi być w przyszłości
        now = timezone.now()
        allowed_minutes = {0, 10, 20, 30, 40, 50}
        if value.minute not in allowed_minutes or value.second != 0 or value.microsecond != 0:
            raise serializers.ValidationError(
                "Start seansu musi być wyrównany do pełnej godziny lub 10/20/30/40/50 minut (sekundy muszą być równe 0)"
            )
        if value < now:
            raise serializers.ValidationError("Start seansu musi być w przyszłości")
        return value
    

    def validate_published_at(self, value):
        # Walidacja published_at (opcjonalne):
        # - jeżeli brak wartości -> ustaw "teraz"
        # - jeżeli podano przez klienta -> nie może być w przeszłości
        now = timezone.now()
        if value is None:
            # Jeśli klient podał null, traktujemy to jako "opublikuj teraz"
            value = now
            return value
        # Sprawdzaj przeszłość tylko gdy pole rzeczywiście było w payloadzie klienta
        provided_explicitly = isinstance(getattr(self, 'initial_data', None), dict) and 'published_at' in self.initial_data and self.initial_data.get('published_at') is not None
        if provided_explicitly and value < now:
            raise serializers.ValidationError("Publikacja seansu musi być w teraźniejszości lub przyszłości")
        return value

    def validate(self, attrs):
        # Walidacja zależna od wielu pól (spójność harmonogramu):
        # - brak duplikatu (auditorium + start_time)
        # - minimum 30 min przerwy po poprzednim seansie
        # - minimum 30 min przerwy przed kolejnym seansem (brak nachodzenia)
        instance = getattr(self, 'instance', None)
        auditorium = attrs.get('auditorium', getattr(instance, 'auditorium', None))
        start_time = attrs.get('start_time', getattr(instance, 'start_time', None))
        movie = attrs.get('movie', getattr(instance, 'movie', None))
        published_at = attrs.get('published_at', getattr(instance, 'published_at', None))

        # Nie pozwól na seans przed datą premiery kina (cinema_release_date) filmu
        if movie is not None and start_time is not None:
            movie_premiere = movie.cinema_release_date
            if start_time.date() < movie_premiere:
                raise serializers.ValidationError({
                    'start_time': 'Seans nie może się rozpocząć przed datą premiery kinowej filmu.'
                })

        # start_time nie może być wcześniejszy niż published_at (logika: nie publikujemy seansu "po fakcie")
        if published_at is not None and start_time is not None:
            if start_time < published_at:
                raise serializers.ValidationError({
                    'start_time': 'Start seansu nie może być wcześniejszy niż data publikacji.'
                })
        # Sprawdzenie tylko gdy mamy komplet kluczowych danych
        if auditorium is not None and start_time is not None:
            # Przy aktualizacji wyklucz bieżący rekord z zapytań
            self_pk = getattr(self.instance, 'pk', None)

            # Dokładnie ten sam czas w tej samej sali — konflikt (z wykluczeniem siebie)
            dup_qs = Screening.objects.filter(auditorium=auditorium, start_time=start_time)
            if self_pk is not None:
                dup_qs = dup_qs.exclude(pk=self_pk)
            if dup_qs.exists():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        'Seans o podanym czasie w tej sali już istnieje.'
                    ]
                })

            # Jeżeli znamy film, egzekwuj zasady planowania oparte o jego długość
            if movie is not None:
                # Wylicz planowany koniec seansu i bufor
                proposed_end = start_time + timedelta(minutes=movie.duration_minutes)
                buffer = timedelta(minutes=30)

                # Poprzedni seans w tej sali
                prev_qs = Screening.objects.filter(auditorium=auditorium, start_time__lt=start_time)
                if self_pk is not None:
                    prev_qs = prev_qs.exclude(pk=self_pk)
                prev = (
                    prev_qs
                    .order_by('-start_time')
                    .select_related('movie')
                    .first()
                )
                if prev is not None:
                    prev_end = prev.start_time + timedelta(minutes=prev.movie.duration_minutes)
                    if prev_end + buffer > start_time:
                        raise serializers.ValidationError({
                            'non_field_errors': [
                                'Start seansu jest za wczesny: musi być co najmniej 30 minut po zakończeniu poprzedniego seansu.'
                            ]
                        })

                # Następny seans w tej sali
                nxt_qs = Screening.objects.filter(auditorium=auditorium, start_time__gt=start_time)
                if self_pk is not None:
                    nxt_qs = nxt_qs.exclude(pk=self_pk)
                nxt = (
                    nxt_qs
                    .order_by('start_time')
                    .first()
                )
                if nxt is not None:
                    # Kolejny seans musi zaczynać się minimum 30 min po końcu tworzonego
                    if proposed_end + buffer > nxt.start_time:
                        raise serializers.ValidationError({
                            'non_field_errors': [
                                'Seans nachodzi na poprzedni lub nie pozostawia wystarczającej przerwy przed następnym seansem (wymagany bufor 30 minut).'
                            ]
                        })
        return attrs