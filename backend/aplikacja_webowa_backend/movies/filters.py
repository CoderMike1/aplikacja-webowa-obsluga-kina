import django_filters
from .models import Movie

class MovieFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    directors = django_filters.CharFilter(field_name='directors', lookup_expr='icontains')
    category = django_filters.CharFilter(field_name='category', lookup_expr='exact')
    is_special_event = django_filters.BooleanFilter(field_name='is_special_event')
    cinema_after = django_filters.DateFilter(field_name='cinema_release_date', lookup_expr='gte')
    cinema_before = django_filters.DateFilter(field_name='cinema_release_date', lookup_expr='lte')

    class Meta:
        model = Movie
        fields = ['title', 'directors', 'category', 'is_special_event', 'cinema_after', 'cinema_before']
