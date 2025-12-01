from django.db import models
from django.conf import settings
from django.utils import timezone
from auditorium.models import Seat
from screenings.models import Screening
import uuid


class TicketType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.name} ({self.price} zł)"


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
    order_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name="ticket")
    type = models.ForeignKey(TicketType, on_delete=models.PROTECT, related_name="tickets")
    purchased_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD{int(timezone.now().timestamp())}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Ticket #{self.pk} ({self.type.name}) for reservation {self.reservation_id}"


class PromotionRule(models.Model):
    name = models.CharField(max_length=100)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    min_tickets = models.IntegerField(blank=True, null=True)
    weekday = models.IntegerField(blank=True, null=True)
    time_from = models.TimeField(blank=True, null=True)
    time_to = models.TimeField(blank=True, null=True)
    ticket_type = models.ForeignKey(TicketType, on_delete=models.SET_NULL, blank=True, null=True)
    screening = models.ForeignKey(Screening, on_delete=models.SET_NULL, blank=True, null=True)

    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()

    def is_active(self):
        now = timezone.now()
        return self.valid_from <= now <= self.valid_to

    def matches(self, reservation, ticket_type=None):
        if not self.is_active():
            return False

        if self.weekday is not None and reservation.screening.start_time.weekday() != self.weekday:
            return False

        if self.time_from and self.time_to:
            screening_time = reservation.screening.start_time.time()
            if not (self.time_from <= screening_time <= self.time_to):
                return False
        if self.ticket_type:
            actual_type = getattr(reservation, 'ticket', None)
            if actual_type:
                if reservation.ticket.type != self.ticket_type:
                    return False
            elif ticket_type:
                if ticket_type != self.ticket_type:
                    return False
            else:
                return False  # brak ticket i ticket_type -> nie pasuje

        if self.min_tickets and reservation.seats.count() < self.min_tickets:
            return False

        if self.screening and reservation.screening != self.screening:
            return False

        return True

    def __str__(self):
        return f"{self.name} ({self.discount_percent}% off)"


def calculate_ticket_price(reservation, ticket_type=None):
    if hasattr(reservation, 'ticket'):
        price = reservation.ticket.type.price
    elif ticket_type:
        price = ticket_type.price
    else:
        raise ValueError("Nie podano TicketType ani istniejącego biletu.")

    active_promos = PromotionRule.objects.all()
    applicable_promos = [p for p in active_promos if p.matches(reservation, ticket_type=ticket_type)]

    if applicable_promos:
        best_promo = max(applicable_promos, key=lambda p: p.discount_percent)
        price *= (1 - best_promo.discount_percent / 100)

    return round(price, 2)
