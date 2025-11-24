from django.db import models


class Auditorium(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Seat(models.Model):
    auditorium = models.ForeignKey(Auditorium, on_delete=models.CASCADE, related_name="seats")
    row_number = models.IntegerField()
    seat_number = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['auditorium', 'row_number', 'seat_number'],
                name='uniq_seat_per_auditorium_row_number'
            )
        ]

    def __str__(self):
        return f"{self.auditorium.name} - R{self.row_number}S{self.seat_number}"
