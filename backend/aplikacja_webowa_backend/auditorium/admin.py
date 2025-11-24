from django.contrib import admin
from .models import Auditorium, Seat


@admin.register(Auditorium)
class AuditoriumAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ("id", "auditorium", "row_number", "seat_number")
    list_filter = ("auditorium",)
    search_fields = ("auditorium__name",)
    ordering = ("auditorium", "row_number", "seat_number")
