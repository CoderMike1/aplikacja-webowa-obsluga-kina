from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Movie
from .serializers import MovieReadSerializer, MovieWriteSerializer
from .filters import MovieFilter
from rest_framework.permissions import IsAdminUser, SAFE_METHODS, AllowAny
from django.db import IntegrityError
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date
from rest_framework.pagination import PageNumberPagination

class MovieByCategoryAPIView(APIView):
    def get(self, request):
        movies = Movie.objects.all().prefetch_related('genres')
        buckets = {
            "now_playing": [],
            "upcoming": [],
            "special_event": [],
            "archival": [],
        }
        for m in movies:
            if getattr(m, 'is_special_event', False):
                buckets["special_event"].append(m)
            elif m.cinema_release_date:
                today = date.today()
                if m.cinema_release_date > today:
                    buckets["upcoming"].append(m)
                elif m.cinema_release_date <= today:
                    buckets["now_playing"].append(m)
            else:
                buckets["archival"].append(m)
        data = {key: MovieReadSerializer(buckets[key], many=True).data for key in buckets}
        return Response(data)
    
class MovieAPIView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get(self, request):
        queryset = Movie.objects.all()
        filterset = MovieFilter(request.GET, queryset=queryset)
        if filterset.is_valid():
            filtered_qs = filterset.qs
        else:
            filtered_qs = queryset
        paginator = PageNumberPagination()
        paginator.page_size = request.query_params.get('page_size', 20)
        page = paginator.paginate_queryset(filtered_qs, request)
        if page is not None:
            serializer = MovieReadSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = MovieReadSerializer(filtered_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = MovieWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            movie = serializer.save()
        except IntegrityError:
            return Response({'non_field_errors': ['Film o tym tytule już istnieje.']}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(MovieReadSerializer(movie).data, status=status.HTTP_201_CREATED)

class MovieDetailAPIView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def _update_and_respond(self, request, movie_id: int, *, partial: bool):
        try:
            movie = Movie.objects.get(pk=movie_id)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MovieWriteSerializer(movie, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            movie = serializer.save()
        except IntegrityError:
            return Response({'non_field_errors': ['Film o tym tytule już istnieje.']}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MovieReadSerializer(movie).data, status=status.HTTP_200_OK)

    def get(self, request, pk):
        try:
            movie = Movie.objects.get(pk=pk)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MovieReadSerializer(movie)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        return self._update_and_respond(request, pk, partial=True)

    def put(self, request, pk):
        return self._update_and_respond(request, pk, partial=False)

    def delete(self, request, pk):
        movie = get_object_or_404(Movie, pk=pk)
        movie.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)