from rest_framework import serializers
from django.utils import timezone
from screenings.models import Screening
from auditorium.models import Seat
from tickets.models import Ticket, TicketType, calculate_ticket_price
from auditorium.serializers import SeatReadSerializer


class InstantPurchaseSerializer(serializers.Serializer):
    screening_id = serializers.IntegerField()
    seat_ids = serializers.ListField(child=serializers.IntegerField())
    ticket_type_id = serializers.IntegerField()

    def validate(self, data):
        screening_id = data["screening_id"]
        seat_ids = data["seat_ids"]
        ticket_type_id = data["ticket_type_id"]

        try:
            screening = Screening.objects.get(id=screening_id)
        except Screening.DoesNotExist:
            raise serializers.ValidationError("Screening not found")

        seats = Seat.objects.filter(id__in=seat_ids, auditorium=screening.auditorium)
        if seats.count() != len(seat_ids):
            raise serializers.ValidationError("Some seats do not exist")

        try:
            ticket_type = TicketType.objects.get(id=ticket_type_id)
        except TicketType.DoesNotExist:
            raise serializers.ValidationError("TicketType not found")

        if Ticket.objects.filter(screening=screening, seats__in=seats).exists():
            raise serializers.ValidationError("One or more seats already sold")

        data["screening"] = screening
        data["seats"] = seats
        data["ticket_type"] = ticket_type
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        screening = validated_data["screening"]
        seats = validated_data["seats"]
        ticket_type = validated_data["ticket_type"]

        total_price = calculate_ticket_price(seats, ticket_type, screening)

        ticket = Ticket.objects.create(
            user=user,
            screening=screening,
            type=ticket_type,
            total_price=total_price
        )
        ticket.seats.set(seats)
        return ticket

class TicketSerializer(serializers.ModelSerializer):
    screening = serializers.SerializerMethodField()
    seats = serializers.SerializerMethodField()
    ticket_type = serializers.CharField(source="type.name")

    class Meta:
        model = Ticket
        fields = [
            "id",
            "order_number",
            "total_price",
            "ticket_type",
            "purchased_at",
            "screening",
            "seats",
        ]

    def get_screening(self, obj):
        screening = obj.screening
        return {
            "id": screening.id,
            "movie": screening.movie.title if hasattr(screening, "movie") else None,
            "start_time": screening.start_time,
            "auditorium_id": screening.auditorium.id,
        }

    def get_seats(self, obj):
        return [
            {"id": seat.id, "row_number": seat.row_number, "seat_number": seat.seat_number}
            for seat in obj.seats.all()
        ]
