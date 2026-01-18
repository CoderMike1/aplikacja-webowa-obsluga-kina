from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from movies.serializers import GenreSerializer, MovieReadSerializer
from auditorium.serializers import AuditoriumReadSerializer
from movies.models import Movie
from auditorium.models import Auditorium
from .models import ProjectionType, Screening


class ProjectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectionType
        fields = ['id', 'name']


class ScreeningGroupedListSerializer(serializers.ListSerializer):
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
    movie = MovieReadSerializer(read_only=True)
    auditorium = AuditoriumReadSerializer(read_only=True)
    genres = GenreSerializer(source='movie.genres', many=True, read_only=True)
    projection_type = ProjectionTypeSerializer(read_only=True)

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
    movie_id = serializers.PrimaryKeyRelatedField(
        queryset=Movie.objects.all(), source='movie', write_only=True, required=True
    )
    auditorium_id = serializers.PrimaryKeyRelatedField(
        queryset=Auditorium.objects.all(), source='auditorium', write_only=True, required=True
    )
    projection_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectionType.objects.all(), source='projection_type', write_only=True, required=False, allow_null=True
    )
    published_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)

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
        # dozwolone tylko pelne godziny i minuty co 10
        # sekundy równe 0
        # przyszlosc
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
        # jesli brak to czas teraz
        # przyszlosc
        now = timezone.now()
        if value is None:
            value = now
            return value
        
        provided_explicitly = isinstance(getattr(self, 'initial_data', None), dict) and 'published_at' in self.initial_data and self.initial_data.get('published_at') is not None
        if provided_explicitly and value < now:
            raise serializers.ValidationError("Publikacja seansu musi być w teraźniejszości lub przyszłości")
        return value

    def validate(self, attrs):
        # brak duplikatu (auditorium i start_time)
        # minimum 30 min przerwy miedzy seansami
        instance = getattr(self, 'instance', None)
        auditorium = attrs.get('auditorium', getattr(instance, 'auditorium', None))
        start_time = attrs.get('start_time', getattr(instance, 'start_time', None))
        movie = attrs.get('movie', getattr(instance, 'movie', None))
        published_at = attrs.get('published_at', getattr(instance, 'published_at', None))

        if movie is not None and start_time is not None:
            movie_premiere = movie.cinema_release_date
            if start_time.date() < movie_premiere:
                raise serializers.ValidationError({
                    'start_time': 'Seans nie może się rozpocząć przed datą premiery kinowej filmu.'
                })

        if published_at is not None and start_time is not None:
            if start_time < published_at:
                raise serializers.ValidationError({
                    'start_time': 'Start seansu nie może być wcześniejszy niż data publikacji.'
                })
        if auditorium is not None and start_time is not None:
            self_pk = getattr(self.instance, 'pk', None)

            dup_qs = Screening.objects.filter(auditorium=auditorium, start_time=start_time)
            if self_pk is not None:
                dup_qs = dup_qs.exclude(pk=self_pk)
            if dup_qs.exists():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        'Seans o podanym czasie w tej sali już istnieje.'
                    ]
                })

            if movie is not None:
                proposed_end = start_time + timedelta(minutes=movie.duration_minutes)
                buffer = timedelta(minutes=30)

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

                nxt_qs = Screening.objects.filter(auditorium=auditorium, start_time__gt=start_time)
                if self_pk is not None:
                    nxt_qs = nxt_qs.exclude(pk=self_pk)
                nxt = (
                    nxt_qs
                    .order_by('start_time')
                    .first()
                )
                if nxt is not None:
                    if proposed_end + buffer > nxt.start_time:
                        raise serializers.ValidationError({
                            'non_field_errors': [
                                'Seans nachodzi na poprzedni lub nie pozostawia wystarczającej przerwy przed następnym seansem (wymagany bufor 30 minut).'
                            ]
                        })
        return attrs