from django_filters import rest_framework as filters
from django.db.models import Count
from .models import Ticket


class TicketFilter(filters.FilterSet):
    purchased_at_after = filters.IsoDateTimeFilter(field_name='purchased_at', lookup_expr='gte')
    purchased_at_before = filters.IsoDateTimeFilter(field_name='purchased_at', lookup_expr='lte')
    payment_status = filters.CharFilter(field_name='payment_status')
    screening_id = filters.NumberFilter(field_name='screening__id')
    user_id = filters.NumberFilter(field_name='user__id')
    movie_id = filters.NumberFilter(field_name='screening__movie__id')

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
