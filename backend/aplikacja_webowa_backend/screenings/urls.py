from django.urls import path
from .views import ScreeningDetailView, ScreeningView

urlpatterns = [
    path('', ScreeningView.as_view(), name='screening-list'),
    path('<int:pk>/', ScreeningDetailView.as_view(), name='screening-detail'),
]
