from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, SAFE_METHODS
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django_filters.rest_framework import DjangoFilterBackend

from .models import Auditorium, Seat
from .serializers import (
    AuditoriumReadSerializer,
    AuditoriumWriteSerializer,
    SeatReadSerializer,
    SeatWriteSerializer,
)
from .filters import SeatFilter


class AuditoriumAPIView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        auditoriums = Auditorium.objects.all()
        serializer = AuditoriumReadSerializer(auditoriums, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AuditoriumWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        auditorium = serializer.save()
        return Response(AuditoriumReadSerializer(auditorium).data, status=status.HTTP_201_CREATED)


class AuditoriumDetailAPIView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def _update_and_respond(self, request, pk, *, partial: bool):
        try:
            auditorium = Auditorium.objects.get(pk=pk)
        except Auditorium.DoesNotExist:
            return Response({'detail': 'Auditorium not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AuditoriumWriteSerializer(auditorium, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        auditorium = serializer.save()
        return Response(AuditoriumReadSerializer(auditorium).data, status=status.HTTP_200_OK)

    def get(self, request, pk):
        try:
            auditorium = Auditorium.objects.get(pk=pk)
        except Auditorium.DoesNotExist:
            return Response({'detail': 'Auditorium not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AuditoriumReadSerializer(auditorium)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        return self._update_and_respond(request, pk, partial=True)

    def put(self, request, pk):
        return self._update_and_respond(request, pk, partial=False)

    def delete(self, request, pk):
        auditorium = get_object_or_404(Auditorium, pk=pk)
        auditorium.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SeatAPIView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        seats = Seat.objects.select_related('auditorium')
        
        filterset = SeatFilter(request.GET, queryset=seats)
        if filterset.is_valid():
            seats = filterset.qs
        
        serializer = SeatReadSerializer(seats, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SeatWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
       
        seat = serializer.save()
        return Response(SeatReadSerializer(seat).data, status=status.HTTP_201_CREATED)


class SeatDetailAPIView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def _update_and_respond(self, request, pk, *, partial: bool):
        try:
            seat = Seat.objects.select_related('auditorium').get(pk=pk)
        except Seat.DoesNotExist:
            return Response({'detail': 'Seat not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SeatWriteSerializer(seat, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        seat = serializer.save()
        return Response(SeatReadSerializer(seat).data, status=status.HTTP_200_OK)

    def get(self, request, pk):
        try:
            seat = Seat.objects.select_related('auditorium').get(pk=pk)
        except Seat.DoesNotExist:
            return Response({'detail': 'Seat not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SeatReadSerializer(seat)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        return self._update_and_respond(request, pk, partial=True)

    def put(self, request, pk):
        return self._update_and_respond(request, pk, partial=False)

    def delete(self, request, pk):
        seat = get_object_or_404(Seat, pk=pk)
        seat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)