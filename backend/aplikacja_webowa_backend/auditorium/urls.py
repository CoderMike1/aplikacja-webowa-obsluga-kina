from django.urls import path
from .views import AuditoriumListView, AuditoriumDetailView

urlpatterns = [
    path('auditoriums/', AuditoriumListView.as_view(), name='auditorium-list'),
    path('auditoriums/<int:pk>/', AuditoriumDetailView.as_view(), name='auditorium-detail'),
]
