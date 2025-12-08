from django.urls import path
from .views import ScreeningSeatsView, InstantPurchaseView, PromotionListView

urlpatterns = [
    path('screenings/<int:pk>/seats/', ScreeningSeatsView.as_view(), name='screening-seats'),
    path('purchase/', InstantPurchaseView.as_view(), name='instant-purchase'),
    path('promotions/', PromotionListView.as_view(), name='promotions-list'),
]
