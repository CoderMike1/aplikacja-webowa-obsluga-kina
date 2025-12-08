from django.db import models
from django.conf import settings
from screenings.models import Screening
from auditorium.models import Seat
import uuid

class TicketType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.name} ({self.price} zł)"

class Ticket(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    screening = models.ForeignKey(Screening, on_delete=models.CASCADE)
    seats = models.ManyToManyField(Seat)
    type = models.ForeignKey(TicketType, on_delete=models.PROTECT)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    purchased_at = models.DateTimeField(auto_now_add=True)
    order_number = models.CharField(max_length=50, blank=True)
    first_name = models.CharField(max_length=100, default="")
    last_name = models.CharField(max_length=100, default="")
    email = models.EmailField(default="")
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
    )
    payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default='PENDING'
    )

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD{int(timezone.now().timestamp())}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)


from django.utils import timezone

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

    def matches(self, seats_count, ticket_type=None, screening=None):
        if not self.is_active():
            return False

        if self.weekday is not None and screening.start_time.weekday() != self.weekday:
            return False

        if self.time_from and self.time_to:
            screening_time = screening.start_time.time()
            if not (self.time_from <= screening_time <= self.time_to):
                return False

        if self.ticket_type and ticket_type != self.ticket_type:
            return False

        if self.min_tickets and seats_count < self.min_tickets:
            return False

        if self.screening and screening != self.screening:
            return False

        return True

def calculate_ticket_price(seats, ticket_type, screening):
    base_price = ticket_type.price
    seats_count = len(seats)

    active_promos = PromotionRule.objects.all()
    applicable_promos = [p for p in active_promos if p.matches(seats_count, ticket_type, screening)]

    if applicable_promos:
        best_promo = max(applicable_promos, key=lambda p: p.discount_percent)
        base_price *= (1 - best_promo.discount_percent / 100)

    total_price = round(base_price * seats_count, 2)
    return total_price
