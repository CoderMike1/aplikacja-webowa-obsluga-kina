from django.contrib import admin
from .models import Ticket, TicketType, PromotionRule
from auditorium.models import Seat

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'order_number',
        'user',
        'get_ticket_type',  # zamiast ticket_type
        'screening',
        'purchased_at',
        'total_price',
        'seats_list'
    )
    list_filter = ('purchased_at', 'type', 'screening')
    search_fields = ('user__username', 'screening__movie__title')
    ordering = ('-purchased_at',)

    def seats_list(self, obj):
        return ", ".join([f"R{seat.row}S{seat.number}" for seat in obj.seats.all()])
    seats_list.short_description = "Seats"

    def get_ticket_type(self, obj):
        return obj.type.name
    get_ticket_type.short_description = "Ticket Type"


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')
    search_fields = ('name',)

@admin.register(PromotionRule)
class PromotionRuleAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'discount_percent',
        'valid_from',
        'valid_to',
        'weekday',
        'ticket_type',
        'screening'
    )
    list_filter = ('ticket_type', 'screening', 'weekday', 'valid_from', 'valid_to')
    search_fields = ('name',)
