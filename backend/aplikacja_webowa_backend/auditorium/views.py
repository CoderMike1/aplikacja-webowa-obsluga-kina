from rest_framework import generics
from .models import Auditorium
from .serializers import AuditoriumSerializer, SeatSerializer
from rest_framework.views import APIView
from rest_framework.response import Response


class AuditoriumListView(generics.ListAPIView):
    queryset = Auditorium.objects.all()
    serializer_class = AuditoriumSerializer


class AuditoriumDetailView(generics.RetrieveAPIView):
    queryset = Auditorium.objects.all()
    serializer_class = AuditoriumSerializer

