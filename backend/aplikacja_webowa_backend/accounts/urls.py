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
    UserProfileView,
    ChangePasswordView,
    MyTicketsView,
    AvatarUploadConfigView,
)
from .views import UserInfo

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('me/',UserInfo.as_view(),name='user_info'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/password/', ChangePasswordView.as_view(), name='change_password'),
    path('me/tickets/', MyTicketsView.as_view(), name='my_tickets'),
    path('profile/avatar/config/', AvatarUploadConfigView.as_view(), name='avatar_upload_config'),
]