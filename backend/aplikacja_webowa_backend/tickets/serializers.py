from rest_framework import serializers
from django.utils import timezone
from screenings.models import Screening
from auditorium.models import Seat
from tickets.models import Reservation, Ticket, TicketType, calculate_ticket_price
from auditorium.serializers import SeatReadSerializer


class ReservationWriteSerializer(serializers.Serializer):
    screening_id = serializers.IntegerField()
    seat_ids = serializers.ListField(child=serializers.IntegerField())

    def validate(self, data):
        screening_id = data["screening_id"]
        seat_ids = data["seat_ids"]

        try:
            screening = Screening.objects.get(id=screening_id)
        except Screening.DoesNotExist:
            raise serializers.ValidationError("Screening not found")

        seats = Seat.objects.filter(id__in=seat_ids)
        if seats.count() != len(seat_ids):
            raise serializers.ValidationError("One or more seats do not exist")

        now = timezone.now()

        sold = Reservation.objects.filter(
            screening=screening,
            seats__in=seats,
            is_finalized=True,
        ).exists()
        if sold:
            raise serializers.ValidationError("Some seats are already SOLD.")

        reserved = Reservation.objects.filter(
            screening=screening,
            seats__in=seats,
            is_finalized=False,
            expires_at__gt=now
        ).exists()
        if reserved:
            raise serializers.ValidationError("Some seats are already RESERVED.")

        data["screening"] = screening
        data["seats"] = seats
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        screening = validated_data["screening"]
        seats = validated_data["seats"]
        now = timezone.now()

        reservation = Reservation.objects.create(
            screening=screening,
            user=user,
            expires_at=now + timezone.timedelta(minutes=10)
        )
        reservation.seats.set(seats)
        return reservation


class ReservationReadSerializer(serializers.ModelSerializer):
    seats = SeatReadSerializer(many=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = ["id", "screening", "seats", "reserved_at", "expires_at", "is_finalized", "status"]

    def get_status(self, obj):
        if obj.is_finalized:
            return "SOLD"
        elif obj.is_expired():
            return "EXPIRED"
        else:
            return "RESERVED"


class PurchaseSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField()
    ticket_type_id = serializers.IntegerField(required=True)

    def validate(self, data):
        try:
            reservation = Reservation.objects.get(id=data["reservation_id"])
        except Reservation.DoesNotExist:
            raise serializers.ValidationError("Reservation not found")

        if reservation.is_expired():
            raise serializers.ValidationError("Reservation expired")
        if reservation.is_finalized:
            raise serializers.ValidationError("Reservation already finalized")

        data["reservation"] = reservation
        try:
            ticket_type = TicketType.objects.get(id=data["ticket_type_id"])
        except TicketType.DoesNotExist:
            raise serializers.ValidationError("Ticket type not found")

        data["ticket_type"] = ticket_type
        return data

    def save(self):
        reservation = self.validated_data["reservation"]
        ticket_type = self.validated_data["ticket_type"]
        temp_ticket = Ticket(reservation=reservation, type=ticket_type)
        price = calculate_ticket_price(reservation)

        ticket = Ticket.objects.create(
            reservation=reservation,
            type=ticket_type,
            total_price=price
        )

        reservation.is_finalized = True
        reservation.save()

        return ticket


class TicketSerializer(serializers.ModelSerializer):
    reservation_id = serializers.IntegerField(source="reservation.id", read_only=True)
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
            "reservation_id",
            "screening",
            "seats"
        ]

    def get_screening(self, obj):
        screening = obj.reservation.screening
        return {
            "id": screening.id,
            "movie": screening.movie.title if hasattr(screening, "movie") else None,
            "start_time": screening.start_time,
            "auditorium_id": screening.auditorium.id,
        }

    def get_seats(self, obj):
        return [
            {"id": seat.id, "row": seat.row, "number": seat.number}
            for seat in obj.reservation.seats.all()
        ]
