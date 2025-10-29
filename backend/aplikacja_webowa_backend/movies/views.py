from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Movie
from .serializers import MovieSerializer

class MovieByCategoryAPIView(APIView):
    def get(self, request):
        movies = Movie.objects.all()

        data = {
            "grane_teraz": MovieSerializer([m for m in movies if m.category == "grane teraz"], many=True).data,
            "wkrótce": MovieSerializer([m for m in movies if m.category == "wkrótce"], many=True).data,
            "wydarzenia_specjalne": MovieSerializer([m for m in movies if m.category == "wydarzenie specjalne"], many=True).data,
        }

        return Response(data)

