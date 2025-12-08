import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from screenings.models import Screening
from auditorium.models import Seat
from .models import Ticket, PromotionRule, TicketType
from .serializers import InstantPurchaseSerializer, InstantPurchaseResponseSerializer, PromotionRuleSerializer
from rest_framework.permissions import AllowAny


class ScreeningSeatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        screening = get_object_or_404(Screening, id=pk)
        seats = Seat.objects.filter(auditorium=screening.auditorium)

        sold_seat_ids = set(
            Ticket.objects.filter(screening=screening)
            .values_list("seats__id", flat=True)
        )

        rows = {}
        for seat in seats:
            row_key = seat.row_number
            if row_key not in rows:
                rows[row_key] = []

            rows[row_key].append({
                "id": seat.id,
                "row_number": seat.row_number,
                "seat_number": seat.seat_number,
                "reserved": seat.id in sold_seat_ids,
            })

        return Response(rows)


class InstantPurchaseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        input_serializer = InstantPurchaseSerializer(
            data=request.data,
            context={'request': request}
        )
        input_serializer.is_valid(raise_exception=True)
        tickets = input_serializer.save()

        tickets_serializer = InstantPurchaseResponseSerializer(
            tickets,
            many=True
        )

        total_price = sum(t.total_price for t in tickets)
        # Wspólny numer zamówienia dla całej transakcji (nie modyfikujemy bazy)
        purchase_time = tickets[0].purchased_at
        group_order_number = f"ORD{int(purchase_time.timestamp())}-{uuid.uuid4().hex[:6]}"

        first_ticket = tickets[0]
        customer_info = {
            "loggedIn": first_ticket.user is not None,
            "first_name": first_ticket.first_name,
            "last_name": first_ticket.last_name,
            "email": first_ticket.email,
            "phone": first_ticket.phone_number,
        }

        response_data = {
            "order_number": group_order_number,
            "purchase_time": purchase_time,
            "customer_info": customer_info,
            "tickets": tickets_serializer.data,
            "total_price": total_price
        }

        return Response(response_data, status=status.HTTP_201_CREATED)

class PromotionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        promotions = PromotionRule.objects.all()

        screening_id = request.query_params.get("screening_id")
        ticket_type_id = request.query_params.get("ticket_type_id")

        promotions = [p for p in promotions if p.is_active()]

        if screening_id:
            try:
                screening = Screening.objects.get(id=screening_id)
                promotions = [p for p in promotions if not p.screening or p.screening == screening]
            except Screening.DoesNotExist:
                return Response({"error": "Screening not found"}, status=status.HTTP_404_NOT_FOUND)

        if ticket_type_id:
            try:
                ticket_type = TicketType.objects.get(id=ticket_type_id)
                promotions = [p for p in promotions if not p.ticket_type or p.ticket_type == ticket_type]
            except TicketType.DoesNotExist:
                return Response({"error": "TicketType not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PromotionRuleSerializer(promotions, many=True)
        return Response(serializer.data)