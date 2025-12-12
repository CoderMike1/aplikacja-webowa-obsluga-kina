from django_filters import rest_framework as filters
from django.db.models import Count
from .models import Ticket
from django.db.models import Q



class TicketFilter(filters.FilterSet):
    purchased_at_after = filters.IsoDateTimeFilter(field_name='purchased_at', lookup_expr='gte')
    purchased_at_before = filters.IsoDateTimeFilter(field_name='purchased_at', lookup_expr='lte')
    payment_status = filters.CharFilter(field_name='payment_status')
    screening_id = filters.NumberFilter(field_name='screening__id')
    user_id = filters.NumberFilter(field_name='user__id')
    movie_id = filters.NumberFilter(field_name='screening__movie__id')
    auditorium_id = filters.NumberFilter(field_name='screening__auditorium__id')
    # Free-text search across movie title or directors
    movie_query = filters.CharFilter(method='filter_movie_query')

    # Seats count via annotation; use method filters
    min_seats = filters.NumberFilter(method='filter_min_seats')
    max_seats = filters.NumberFilter(method='filter_max_seats')

    class Meta:
        model = Ticket
        fields = [
            'purchased_at_after',
            'purchased_at_before',
            'payment_status',
            'screening_id',
            'user_id',
            'movie_id',
            'auditorium_id',
            'movie_query',
            'min_seats',
            'max_seats',
        ]

    def filter_min_seats(self, queryset, name, value):
        try:
            v = int(value)
        except (TypeError, ValueError):
            return queryset
        qs = queryset.annotate(seats_count_ann=Count('seats'))
        return qs.filter(seats_count_ann__gte=v)

    def filter_max_seats(self, queryset, name, value):
        try:
            v = int(value)
        except (TypeError, ValueError):
            return queryset
        qs = queryset.annotate(seats_count_ann=Count('seats'))
        return qs.filter(seats_count_ann__lte=v)

    def filter_movie_query(self, queryset, name, value):
        if not value:
            return queryset
        # Filter tickets by related movie title or directors (icontains)
        return queryset.filter(
            Q(screening__movie__title__icontains=value) |
            Q(screening__movie__directors__icontains=value)
)

