from rest_framework import serializers
from .models import Auditorium, Seat

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ["id", "row_number", "seat_number"]

class AuditoriumSerializer(serializers.ModelSerializer):
    seats = SeatSerializer(many=True, read_only=True)

    class Meta:
        model = Auditorium
        fields = ["id", "name", "seats"]
