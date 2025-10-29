from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
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


