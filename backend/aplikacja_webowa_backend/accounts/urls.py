from django.urls import path
from accounts import views
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    UserInfo,
    CustomTokenObtainPairView,
)
from .views import UserInfo

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('me/',UserInfo.as_view(),name='user_info')
]