from django.db import models


class Auditorium(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class SeatType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Seat(models.Model):
    auditorium = models.ForeignKey(Auditorium, on_delete=models.CASCADE, related_name="seats")
    row_number = models.IntegerField()
    seat_number = models.IntegerField()
    seat_type = models.ForeignKey(SeatType, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ("auditorium", "row_number", "seat_number")

    def __str__(self):
        return f"{self.auditorium.name} - R{self.row_number}S{self.seat_number}"
