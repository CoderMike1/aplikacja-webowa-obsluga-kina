from django.db import models
from django.conf import settings
from django.utils import timezone
from auditorium.models import Seat
from screenings.models import Screening


class Reservation(models.Model):
    screening = models.ForeignKey(Screening, on_delete=models.CASCADE, related_name="reservations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    seats = models.ManyToManyField(Seat, related_name="reservations")
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_finalized = models.BooleanField(default=False)

    class Meta:
        ordering = ["-reserved_at"]

    def is_expired(self):
        return not self.is_finalized and self.expires_at < timezone.now()


class Ticket(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name="ticket")
    purchased_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Ticket #{self.pk} for reservation {self.reservation_id}"
