from django.utils import timezone
from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q, CheckConstraint

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
            models.UniqueConstraint(fields=['start_time', 'auditorium'], name='unique_auditorium_start_time'),
            CheckConstraint(check=Q(start_time__gte=models.F('published_at')), name='chk_start_time_gte_published_at'),
            CheckConstraint(
                check=(
                    Q(start_time__minute__in=[0,10,20,30,40,50]) &
                    Q(start_time__second=0)
                ),
                name='chk_start_time_minute_alignment'
            ),
        ]
    
    def __str__(self):
        return f"{self.movie.title} at {self.start_time} in {self.auditorium.name}"