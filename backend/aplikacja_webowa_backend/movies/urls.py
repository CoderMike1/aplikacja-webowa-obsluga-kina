from django.urls import path
from .views import MovieByCategoryAPIView, MovieDetailAPIView

urlpatterns = [
    path('categories/', MovieByCategoryAPIView.as_view(), name='movies-by-category'),
    path('<int:movie_id>/', MovieDetailAPIView.as_view(), name='movie-detail'),
]

