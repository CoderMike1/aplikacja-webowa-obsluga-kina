from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from screenings.models import Screening
from auditorium.models import Seat
from .models import Ticket
from .serializers import InstantPurchaseSerializer, TicketSerializer
from auditorium.serializers import SeatReadSerializer
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
                "reserved": True if seat.id in sold_seat_ids else False,
            })

        return Response(rows)

class InstantPurchaseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InstantPurchaseSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        tickets = serializer.save()

        ticket_data = TicketSerializer(tickets, many=True).data

        total_sum = 0
        for t in ticket_data:
            t["price"] = float(t["price"])
            total_sum += t["price"]

        response_data = {
            "tickets": ticket_data,
            "total_price": total_sum
        }

        return Response(response_data, status=status.HTTP_201_CREATED)
