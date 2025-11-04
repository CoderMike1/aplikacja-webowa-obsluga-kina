from rest_framework import serializers
from .models import Auditorium, Seat, SeatType


class SeatTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatType
        fields = "__all__"


class SeatSerializer(serializers.ModelSerializer):
    seat_type = SeatTypeSerializer(read_only=True)

    class Meta:
        model = Seat
        fields = ["id", "row_number", "seat_number", "seat_type"]


class AuditoriumSerializer(serializers.ModelSerializer):
    seats = SeatSerializer(many=True, read_only=True)

    class Meta:
        model = Auditorium
        fields = ["id", "name", "seats"]
