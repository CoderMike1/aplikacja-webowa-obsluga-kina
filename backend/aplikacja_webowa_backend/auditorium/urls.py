from django.urls import path
from .views import (
    AuditoriumAPIView,
    AuditoriumDetailAPIView,
    SeatAPIView,
    SeatDetailAPIView,
)

urlpatterns = [
    path('', AuditoriumAPIView.as_view(), name='auditorium-list'),
    path('<int:pk>/', AuditoriumDetailAPIView.as_view(), name='auditorium-detail'),
    path('seats/', SeatAPIView.as_view(), name='auditorium-seats'),
    path('seats/<int:pk>/', SeatDetailAPIView.as_view(), name='seat-detail'),
]
