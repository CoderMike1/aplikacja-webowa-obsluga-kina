from rest_framework import serializers
from django.utils import timezone
from .models import Genre, Movie


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']


class MovieReadSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    category = serializers.ReadOnlyField()

    class Meta:
        model = Movie
        fields = '__all__'


class MovieWriteSerializer(serializers.ModelSerializer):
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(), source='genres', many=True, write_only=True
    )
    cinema_release_date = serializers.DateField(required=False)
    duration_minutes = serializers.IntegerField(min_value=1, max_value=500)
    description = serializers.CharField(max_length=500)

    class Meta:
        model = Movie
        fields = [
            'title', 'original_title', 'description', 'release_date', 'cinema_release_date',
            'duration_minutes', 'genre_ids', 'directors', 'poster_path', 'is_special_event'
        ]

    def validate(self, attrs):
        release_date = attrs.get('release_date', getattr(self.instance, 'release_date', None))
        cinema_release_date = attrs.get('cinema_release_date', getattr(self.instance, 'cinema_release_date', None))

        if 'cinema_release_date' not in attrs and 'release_date' in attrs and release_date is not None:
            cinema_release_date = release_date
            attrs['cinema_release_date'] = cinema_release_date

        if release_date and cinema_release_date and release_date > cinema_release_date:
            raise serializers.ValidationError({
                'cinema_release_date': 'Premiera kinowa nie może być wcześniejsza niż data wydania filmu.'
            })

        return attrs

    def create(self, validated_data):
        genres = validated_data.pop('genres', [])
        movie = Movie.objects.create(**validated_data)
        if genres:
            movie.genres.set(genres)
        return movie

    def update(self, instance, validated_data):
        genres = validated_data.pop('genres', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if genres is not None:
            instance.genres.set(genres)
        return instance