from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    """Manager for custom user model aligned with CustomUser fields."""

    def _create_user(self, email, username, password, **extra_fields):
        """Create and save a user with the given email, username and password."""
        if not email:
            raise ValueError("The email address must be set")
        if not username:
            raise ValueError("The username must be set")

        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, username, password=None, **extra_fields):
        """Create a regular user."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, username, password, **extra_fields)

    def create_superuser(self, email, username, password, **extra_fields):
        """Create a superuser with admin privileges."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, username, password, **extra_fields)
    

class CustomUser(AbstractUser):
    """Database model for users in the system."""
    email = models.EmailField(max_length=255, unique=True)
    avatar = models.ImageField(null=True, blank=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=False)
    bio = models.TextField(max_length=500, null=False, blank=True)
    location_country = models.CharField(max_length=100, null=False, blank=True)
    location_city = models.CharField(max_length=100, null=False, blank=True)
    two_factor_enabled = models.BooleanField(default=False)

    objects = CustomUserManager()
    
    def __str__(self):
        """Return string representation of the user."""
        return self.email
