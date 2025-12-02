from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from urllib.parse import urlparse
from django.conf import settings


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    avatar = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    location_country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    location_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    two_factor_enabled = serializers.BooleanField(required=False)
    

    def validate(self, attrs):
        User = get_user_model()
        email = attrs.get('email')
        username = attrs.get('username')
        phone = attrs.get('phone')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'User with this email already exists.'})
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'User with this username already exists.'})
        if phone:
            if User.objects.filter(phone=phone).exists():
                raise serializers.ValidationError({'phone': 'User with this phone already exists.'})
        return attrs

    def create(self, validated_data):
        User = get_user_model()
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data.pop('email'),
            username=validated_data.pop('username'),
            password=password,
            **validated_data
        )
        return user
    

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        username = attrs.get('username')
        email = attrs.get('email')
        if not username and not email:
            raise serializers.ValidationError('Provide username or email.')
        if not username and email:
            User = get_user_model()
            try:
                user = User.objects.get(email=email)
                attrs['username'] = user.username
            except ObjectDoesNotExist:
                pass
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["is_staff"] = user.is_staff
        return token


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(get_user_model().objects.all(), message="User with this email already exists.")],
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(get_user_model().objects.all(), message="User with this username already exists.")],
    )

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "phone",
            "date_of_birth",
            "bio",
            "location_country",
            "location_city",
            "two_factor_enabled",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        user = self.instance
        User = get_user_model()
        if user and user.email == value:
            return value
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate_username(self, value):
        user = self.instance
        User = get_user_model()
        if user and user.username == value:
            return value
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("User with this username already exists.")
        return value

    def validate_avatar(self, value):
        if value in (None, ""):
            return value
        try:
            parsed = urlparse(value)
        except Exception:
            raise serializers.ValidationError("Invalid avatar URL.")

        allowed_domain = getattr(settings, "CLOUDINARY_ALLOWED_DOMAIN", "res.cloudinary.com")
        if not parsed.scheme.startswith("http") or not parsed.netloc:
            raise serializers.ValidationError("Avatar must be a valid http(s) URL.")
        hostname = parsed.hostname or ""
        if not (hostname == allowed_domain or hostname.endswith("." + allowed_domain)):
            raise serializers.ValidationError("Avatar must be hosted on an allowed domain.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        validate_password(attrs["new_password"], user)
        return attrs


