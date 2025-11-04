from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Movie
from .serializers import MovieSerializer

class MovieByCategoryAPIView(APIView):
    def get(self, request):
        movies = Movie.objects.all()

        data = {
            "now_playing": MovieSerializer([m for m in movies if m.category == "now_playing"], many=True).data,
            "upcoming": MovieSerializer([m for m in movies if m.category == "upcoming"], many=True).data,
            "special_event": MovieSerializer([m for m in movies if m.category == "special_event"], many=True).data,
        }

        return Response(data)

class MovieDetailAPIView(APIView):
    def get(self, request, movie_id):
        try:
            movie = Movie.objects.get(pk=movie_id)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MovieSerializer(movie)
        return Response(serializer.data, status=status.HTTP_200_OK)