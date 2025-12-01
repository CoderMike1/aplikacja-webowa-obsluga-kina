from django_filters import rest_framework as filters
from .models import Seat


class SeatFilter(filters.FilterSet):
    auditorium_id = filters.NumberFilter(field_name='auditorium__id')

    class Meta:
        model = Seat
        fields = ['auditorium_id']
