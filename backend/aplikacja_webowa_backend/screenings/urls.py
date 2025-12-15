from django.urls import path
from .views import ScreeningDetailView, ScreeningListView, ScreeningView, ProjectionTypeListView

urlpatterns = [
    path('', ScreeningView.as_view(), name='screening-list'),
    path('<int:pk>/', ScreeningDetailView.as_view(), name='screening-detail'),
    path('projection-types/', ProjectionTypeListView.as_view(), name='projection-types-list'),
    path('list/', ScreeningListView.as_view(), name='screening-list-all')
]
