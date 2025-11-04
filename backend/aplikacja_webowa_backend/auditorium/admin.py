from django.contrib import admin
from .models import Auditorium, SeatType, Seat


@admin.register(Auditorium)
class AuditoriumAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(SeatType)
class SeatTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ("id", "auditorium", "row_number", "seat_number", "seat_type")
    list_filter = ("auditorium", "seat_type")
    search_fields = ("auditorium__name",)
    ordering = ("auditorium", "row_number", "seat_number")
