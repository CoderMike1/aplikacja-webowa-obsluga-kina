from django.utils import timezone
from django.db import models

class ProjectionType(models.Model):
    name = models.CharField(max_length=50, unique=True, default='2D')

    def __str__(self):
        return self.name


class Screening(models.Model):
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    auditorium = models.ForeignKey('auditorium.Auditorium', on_delete=models.CASCADE)
    projection_type = models.ForeignKey('ProjectionType', on_delete=models.CASCADE, null=True)
    published_at = models.DateTimeField(null=False, blank=False, default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['start_time', 'auditorium'], name='unique_auditorium_start_time')
        ]
    
    def __str__(self):
        return f"{self.movie.title} at {self.start_time} in {self.auditorium.name}"