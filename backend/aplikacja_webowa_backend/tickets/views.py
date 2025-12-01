from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from screenings.models import Screening
from auditorium.models import Seat
from .models import Ticket
from .serializers import TicketSerializer, InstantPurchaseSerializer
from auditorium.serializers import SeatReadSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

class ScreeningSeatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        screening = get_object_or_404(Screening, id=pk)
        seats = Seat.objects.filter(auditorium=screening.auditorium)

        sold_seat_ids = set(
            Ticket.objects.filter(screening=screening)
            .values_list("seats__id", flat=True)
        )

        seat_data = []
        for seat in seats:
            status_str = "SOLD" if seat.id in sold_seat_ids else "FREE"
            seat_ser = SeatReadSerializer(seat).data
            seat_ser["status"] = status_str
            seat_data.append(seat_ser)

        return Response(seat_data)

class InstantPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InstantPurchaseSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()

        return Response(
            TicketSerializer(ticket).data,
            status=status.HTTP_201_CREATED
        )
