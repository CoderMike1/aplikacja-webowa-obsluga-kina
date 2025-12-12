from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, F


class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Movie(models.Model):
    title = models.CharField(max_length=255)
    original_title = models.CharField(max_length=255)
    description = models.TextField(max_length=500)
    release_date = models.DateField()
    cinema_release_date = models.DateField()
    duration_minutes = models.PositiveIntegerField(help_text="Runtime in minutes")
    genres = models.ManyToManyField(Genre, related_name='movies')
    directors = models.CharField(max_length=255)
    poster_path = models.CharField(max_length=512)
    is_special_event = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-cinema_release_date', 'title']
        constraints = [
            models.CheckConstraint(
                check=Q(release_date__lte=F('cinema_release_date')),
                name='release_date_lte_cinema_release_date'
            ),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Uzupełnij cinema_release_date jeśli brak (domyślnie kopiujemy release_date)
        if not self.cinema_release_date:
            self.cinema_release_date = self.release_date
        super().save(*args, **kwargs)