from django.urls import path
from .views import ScreeningSeatsView, ReservationView, PurchaseView

urlpatterns = [
    path('screenings/<int:pk>/seats/', ScreeningSeatsView.as_view(), name='screening-seats'),
    path('reservations/', ReservationView.as_view(), name='reservation-create'),
    path('reservations/<int:reservation_id>/purchase/', PurchaseView.as_view(), name='purchase-ticket'),
]
