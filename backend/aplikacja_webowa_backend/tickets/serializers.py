from time import timezone
import uuid
from rest_framework import serializers
from screenings.models import Screening
from auditorium.models import Seat
from tickets.models import Ticket, TicketType, calculate_ticket_price, PromotionRule
from django.db.models import Max
from screenings.serializers import ScreeningReadSerializer


class TicketSeatSerializer(serializers.Serializer):
    row_number = serializers.IntegerField(min_value=1)
    seat_number = serializers.IntegerField(min_value=1)


class TicketPurchaseItemSerializer(serializers.Serializer):
    ticket_type_id = serializers.IntegerField()
    seats = TicketSeatSerializer(many=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField(required=False, allow_blank=True)


class InstantPurchaseSerializer(serializers.Serializer):
    screening_id = serializers.IntegerField()
    tickets = TicketPurchaseItemSerializer(many=True)

    def validate(self, data):
        try:
            screening = Screening.objects.get(id=data["screening_id"])
        except Screening.DoesNotExist:
            raise serializers.ValidationError("Screening not found")

        data["screening"] = screening

        for item in data["tickets"]:
            try:
                ticket_type = TicketType.objects.get(id=item["ticket_type_id"])
            except TicketType.DoesNotExist:
                raise serializers.ValidationError("TicketType not found")

            item["ticket_type"] = ticket_type
            seat_objs = []

            for s in item["seats"]:
                row_seats = Seat.objects.filter(
                    auditorium=screening.auditorium,
                    row_number=s["row_number"]
                )
                if not row_seats.exists():
                    raise serializers.ValidationError(f"Row {s['row_number']} does not exist")

                try:
                    seat = row_seats.get(seat_number=s["seat_number"])
                except Seat.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Seat {s['row_number']}-{s['seat_number']} does not exist"
                    )

                if Ticket.objects.filter(screening=screening, seats=seat).exists():
                    raise serializers.ValidationError(
                        f"Seat {s['row_number']}-{s['seat_number']} is already sold"
                    )

                seat_objs.append(seat)

            item["seats_objs"] = seat_objs

        return data

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        screening = validated_data["screening"]

        tickets_created = []

        # Wspólny numer zamówienia dla całej transakcji
        group_order_number = f"ORD{int(timezone.now().timestamp())}-{uuid.uuid4().hex[:6]}"

        for item in validated_data["tickets"]:
            ticket_type = item["ticket_type"]
            seats = item["seats_objs"]
            total_price = calculate_ticket_price(seats, ticket_type, screening)

            ticket = Ticket.objects.create(
                user=user,
                screening=screening,
                type=ticket_type,
                total_price=total_price,
                order_number=group_order_number,
                first_name=item["first_name"],
                last_name=item["last_name"],
                email=item["email"],
                phone_number=item.get("phone_number", ""),
                payment_status="PENDING",
            )
            ticket.seats.set(seats)
            tickets_created.append(ticket)

        return tickets_created

class InstantPurchaseResponseSerializer(serializers.Serializer):
    ticket_type = serializers.CharField(source="type.name")
    price = serializers.DecimalField(max_digits=8, decimal_places=2, source="total_price")
    screening = serializers.SerializerMethodField()
    seat = serializers.SerializerMethodField()

    def get_screening(self, obj):
        screening = obj.screening
        return {
            "id": screening.id,
            "movie": screening.movie.title if hasattr(screening, "movie") else None,
            "start_time": screening.start_time,
            "auditorium_id": screening.auditorium.id,
        }

    def get_seat(self, obj):
        seats = obj.seats.all()
        if seats.exists():
            seat = seats.first()
            return {
                "id": seat.id,
                "row_number": seat.row_number,
                "seat_number": seat.seat_number,
            }
        return None



class TicketSerializer(serializers.ModelSerializer):
    screening = serializers.SerializerMethodField()
    seats = serializers.SerializerMethodField()
    ticket_type = serializers.CharField(source="type.name")
    price = serializers.DecimalField(source="total_price", max_digits=8, decimal_places=2)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "order_number",
            "price",
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


class PromotionRuleSerializer(serializers.ModelSerializer):
    screening = ScreeningReadSerializer(read_only=True)
    class Meta:
        model = PromotionRule
        fields = [
            "id",
            "name",
            "discount_percent",
            "min_tickets",
            "weekday",
            "time_from",
            "time_to",
            "ticket_type",
            "screening",
            "valid_from",
            "valid_to",
        ]
