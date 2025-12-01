from django.urls import path
from .views import ScreeningSeatsView, InstantPurchaseView

urlpatterns = [
    path('screenings/<int:pk>/seats/', ScreeningSeatsView.as_view(), name='screening-seats'),
    path('tickets/purchase/', InstantPurchaseView.as_view(), name='instant-purchase'),
]
