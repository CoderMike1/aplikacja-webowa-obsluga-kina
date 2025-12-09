from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .models import Screening, ProjectionType
from .serializers import ScreeningReadSerializer, ScreeningWriteSerializer
from rest_framework.permissions import IsAdminUser, SAFE_METHODS, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ScreeningFilter
from django.db import IntegrityError


class ScreeningView(APIView):
    filterset_class = ScreeningFilter
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]
    

    def get(self, request):
        qs = (
            Screening.objects.select_related('movie', 'auditorium', 'projection_type')
            .prefetch_related('movie__genres')
            .order_by('movie__title', 'start_time')
            .all()
        )

        filter_backend = DjangoFilterBackend()
        qs = filter_backend.filter_queryset(request, qs, view=self)

        movie_ids_qs = qs.order_by('movie__title').values_list('movie_id', flat=True).distinct()
        movie_ids = list(movie_ids_qs)

        paginator = PageNumberPagination()
        paginator.page_size = 200

        page_movie_ids = paginator.paginate_queryset(movie_ids, request, view=self)

        page_screenings_qs = (
            qs.filter(movie_id__in=page_movie_ids)
            .order_by('movie__title', 'projection_type__name', 'start_time')
        )

        serializer = ScreeningReadSerializer(page_screenings_qs, many=True)
        return paginator.get_paginated_response(serializer.data)
    

    def post(self, request):
        serializer = ScreeningWriteSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
        screening = serializer.save()
        read_serializer = ScreeningReadSerializer(screening, context={'request': request})
        return Response(data=read_serializer.data, status=status.HTTP_201_CREATED)
    
    
class ScreeningDetailView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def _get_queryset(self):
        return (
            Screening.objects.select_related('movie', 'auditorium', 'projection_type')
            .prefetch_related('movie__genres')
        )

    def _update_and_respond(self, request, pk, *, partial: bool):
        instance = get_object_or_404(self._get_queryset(), pk=pk)
        serializer = ScreeningWriteSerializer(instance, data=request.data, partial=partial, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            instance = serializer.save()
        except IntegrityError:
            return Response({"non_field_errors": ["A screening in this auditorium at the given start_time already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        read = ScreeningReadSerializer(instance, context={'request': request})
        return Response(read.data, status=status.HTTP_200_OK)

    def get(self, request, pk):
        screening = get_object_or_404(self._get_queryset(), pk=pk)
        serializer = ScreeningReadSerializer(screening, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request, pk):
        return self._update_and_respond(request, pk, partial=True)
    
    def put(self, request, pk):
        return self._update_and_respond(request, pk, partial=False)
    
    def delete(self, request, pk):
        screening = get_object_or_404(Screening, pk=pk)
        screening.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectionTypeListView(APIView):
    def get_permissions(self):
        return [AllowAny()]

    def get(self, request):
        items = ProjectionType.objects.all().order_by('name')
        data = [{'id': pt.id, 'name': pt.name} for pt in items]
        return Response(data, status=status.HTTP_200_OK)