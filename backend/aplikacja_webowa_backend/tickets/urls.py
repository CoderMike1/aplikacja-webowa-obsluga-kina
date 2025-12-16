from django.urls import path
from .views import ScreeningSeatsView, InstantPurchaseView, PromotionListView, TicketPDFView, TicketsView, CheckPromotionView

urlpatterns = [
    path('screenings/<int:pk>/seats/', ScreeningSeatsView.as_view(), name='screening-seats'),
    path('purchase/', InstantPurchaseView.as_view(), name='instant-purchase'),
    path('promotions/', PromotionListView.as_view(), name='promotions-list'),
    path('ticket/<str:order_number>/pdf/', TicketPDFView.as_view(), name='ticket-pdf'),
    path('tickets/', TicketsView.as_view(), name='tickets-list'),
    path("check-promotion/", CheckPromotionView.as_view(), name="check-promotion"),
]
