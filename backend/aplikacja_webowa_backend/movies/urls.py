from django.urls import path
from .views import MovieByCategoryAPIView, MovieDetailAPIView, MovieAPIView

urlpatterns = [
    path('categories/', MovieByCategoryAPIView.as_view(), name='movies-by-category'),
    path('<int:pk>/', MovieDetailAPIView.as_view(), name='movie-detail'),
    path('', MovieAPIView.as_view(), name='movie-list'),
]

