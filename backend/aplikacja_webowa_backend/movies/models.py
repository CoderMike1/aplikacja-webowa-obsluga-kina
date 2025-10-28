
from django.db import models
from django.utils import timezone
from datetime import timedelta

"""Movies model"""
class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=255)
    original_title = models.CharField(max_length=255, blank=True)
    description = models.TextField(max_length=500, blank=True)
    release_date = models.DateField()
    duration_minutes = models.PositiveIntegerField(help_text="Czas trwania w minutach")
    genres = models.ManyToManyField(Genre, related_name='movies')
    directors = models.CharField(max_length=255, blank=True)
    poster_path = models.CharField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def category(self):
        today = timezone.now().date()
        if self.release_date <= today <= self.release_date + timedelta(days=30):
            return "grane teraz"  # last 30 days
        elif self.release_date > today:
            return "wkrótce"
        else:
            return "wydarzenie specjalne"

    class Meta:
        ordering = ['-release_date', 'title']

    def __str__(self):
        return self.title