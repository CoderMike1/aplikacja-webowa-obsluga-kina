from django_filters import rest_framework as filters
from .models import Screening

class ScreeningFilter(filters.FilterSet):
    movie_title = filters.CharFilter(field_name='movie__title', lookup_expr='icontains')
    auditorium_id = filters.NumberFilter(field_name='auditorium_id')
    auditorium = filters.CharFilter(field_name='auditorium__name', lookup_expr='icontains')
    directors = filters.CharFilter(field_name='movie__directors', lookup_expr='icontains')
    projection_type = filters.CharFilter(field_name='projection_type__name', lookup_expr='iexact')
    genre = filters.CharFilter(method='filter_genre')
    start_after = filters.DateTimeFilter(field_name='start_time', lookup_expr='gte')
    start_before = filters.DateTimeFilter(field_name='start_time', lookup_expr='lt')
    published_after = filters.DateTimeFilter(field_name='published_at', lookup_expr='gte')
    published_before = filters.DateTimeFilter(field_name='published_at', lookup_expr='lt')

    class Meta:
        model = Screening
        fields = ['movie', 'movie_title', 'auditorium', 'directors', 'projection_type', 'genre', 'start_after', 'start_before', 'published_after', 'published_before']

    def filter_genre(self, queryset, name, value):
        return queryset.filter(movie__genres__name__iexact=value)