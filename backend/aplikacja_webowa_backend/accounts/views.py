from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from rest_framework_simplejwt.tokens import RefreshToken
from accounts import serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from tickets.models import Ticket
from tickets.serializers import TicketSerializer
from django.conf import settings


class RegisterView(APIView):
    serializer_class = serializers.RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response({
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "access": access_token
        }, status=status.HTTP_201_CREATED)

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=7 * 24 * 60 * 60,  # 7 dni
        )

        return response


class LoginView(APIView):
    serializer_class = serializers.LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data.get('username')
        password = serializer.validated_data['password']
        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        update_last_login(None, user)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)


        resp = Response({
            "message": "User logged in successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "access": access_token
        },status=status.HTTP_200_OK)

        resp.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=False,        # w produkcji True
            samesite="Lax",
            domain="localhost",
            path="/",
        )

        return resp

class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token is None:
            return Response({"detail": "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            return Response({"access": access_token}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
        response.delete_cookie("refresh_token")
        return response


class UserInfo(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
            "first_name":user.first_name,
            "last_name":user.last_name,
            "phone_number":user.phone
        })


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = serializers.ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = serializers.ProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = serializers.ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        new_password = serializer.validated_data["new_password"]
        user = request.user
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


class MyTicketsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Ticket.objects.filter(user=request.user).order_by('-purchased_at')
        data = TicketSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class AvatarUploadConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "cloud_name": getattr(settings, "CLOUDINARY_CLOUD_NAME", ""),
            "upload_preset": getattr(settings, "CLOUDINARY_UPLOAD_PRESET", ""),
            "allowed_domain": getattr(settings, "CLOUDINARY_ALLOWED_DOMAIN", "res.cloudinary.com"),
        }, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = serializers.CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        data = response.data
        refresh = data.get("refresh")

        if refresh:
            response.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=True,
                samesite="Strict",
                max_age=7 * 24 * 60 * 60,
            )
            del data["refresh"]
            response.data = data

        return response
