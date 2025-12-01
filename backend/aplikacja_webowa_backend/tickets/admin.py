from django.contrib import admin
from .models import Reservation, Ticket, TicketType, PromotionRule

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'screening',
        'user',
        'reserved_at',
        'expires_at',
        'is_finalized',
        'seats_list'
    )
    list_filter = ('is_finalized', 'screening', 'user')
    search_fields = ('user__username', 'screening__movie__title')
    ordering = ('-reserved_at',)

    def seats_list(self, obj):
        return ", ".join([f"R{seat.row_number}S{seat.seat_number}" for seat in obj.seats.all()])
    seats_list.short_description = "Seats"


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'purchased_at',
        'total_price'
    )
    list_filter = ('purchased_at',)
    search_fields = ('reservation__user__username', 'reservation__screening__movie__title')
    ordering = ('-purchased_at',)

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')
    search_fields = ('name',)

@admin.register(PromotionRule)
class PromotionRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_percent', 'valid_from', 'valid_to', 'weekday', 'ticket_type', 'screening')
    list_filter = ('ticket_type', 'screening', 'weekday', 'valid_from', 'valid_to')
    search_fields = ('name',)
