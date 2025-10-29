from django.urls import path
from .views import MovieByCategoryAPIView

urlpatterns = [
    path('categories/', MovieByCategoryAPIView.as_view(), name='movies-by-category'),
]

