from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from screenings.models import Screening
from auditorium.models import Seat
from .models import Reservation, Ticket
from .serializers import (
    ReservationWriteSerializer,
    ReservationReadSerializer,
    PurchaseSerializer,
)
from auditorium.serializers import SeatReadSerializer
from rest_framework.permissions import IsAdminUser, SAFE_METHODS, AllowAny


class ScreeningSeatsView(APIView):
    def get(self, request, pk):
        screening = get_object_or_404(Screening, id=pk)
        seats = Seat.objects.filter(auditorium=screening.auditorium)

        now = timezone.now()
        seat_data = []
        for seat in seats:
            sold = Reservation.objects.filter(
                screening=screening,
                seats=seat,
                is_finalized=True
            ).exists()
            reserved = Reservation.objects.filter(
                screening=screening,
                seats=seat,
                is_finalized=False,
                expires_at__gt=now
            ).exists()

            if sold:
                status_str = "SOLD"
            elif reserved:
                status_str = "RESERVED"
            else:
                status_str = "FREE"

            seat_ser = SeatReadSerializer(seat).data
            seat_ser["status"] = status_str
            seat_data.append(seat_ser)

        return Response(seat_data)


class ReservationView(APIView):
    # dodalem ci autentykacje taką jak w innych views
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]
    

    def post(self, request):
        serializer = ReservationWriteSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        read_serializer = ReservationReadSerializer(reservation)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class PurchaseView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]
    

    def post(self, request, reservation_id):
        serializer = PurchaseSerializer(data={'reservation_id': reservation_id})
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        return Response({"ticket_id": ticket.id, "total_price": ticket.total_price}, status=status.HTTP_201_CREATED)
