import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from screenings.models import Screening
from auditorium.models import Seat
from .models import Ticket, PromotionRule, TicketType
from .serializers import InstantPurchaseSerializer, InstantPurchaseResponseSerializer, PromotionRuleSerializer
from rest_framework.permissions import AllowAny, IsAdminUser
from django.http import HttpResponse
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from io import BytesIO
import base64
import qrcode
import logging
from django.conf import settings
from django.template.loader import get_template
import time
from .filters import TicketFilter
from .templates.tickets.logo_base64 import LOGO_BASE64

logger = logging.getLogger(__name__)

def make_qr_data_url(payload: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return f"data:image/png;base64,{b64}"

class TicketPDFView(APIView):
    permission_classes = [AllowAny]

    def get_ticket_with_retry(self, order_number, retries=5, delay=0.2):
        for _ in range(retries):
            tickets = Ticket.objects.filter(order_number=order_number).prefetch_related('seats', 'type')
            if tickets.exists():
                return tickets
            time.sleep(delay)
        raise Ticket.DoesNotExist

    def get(self, request, order_number):
        try:
            tickets = self.get_ticket_with_retry(order_number)
        except Ticket.DoesNotExist:
            return HttpResponse(
                f"Bilety o numerze zamówienia {order_number} nie zostały znalezione",
                status=404
            )

        first_ticket = tickets.first()
        screening = first_ticket.screening

        qr_payload = f"{order_number}"
        qr_data_url = make_qr_data_url(qr_payload)

        tickets_data = []
        for t in tickets:
            for seat in t.seats.all():
                tickets_data.append({
                    "ticket_id": t.id,
                    "row_number": seat.row_number,
                    "seat_number": seat.seat_number,
                    "ticket_type": t.type.name,
                    "total_price": t.total_price,
                })


        html_string = render_to_string('tickets/ticket_pdf.html', {
            'order_number': order_number,
            'tickets_data': tickets_data,
            'screening': screening,
            'customer': {
                'first_name': first_ticket.first_name,
                'last_name': first_ticket.last_name,
                'email': first_ticket.email,
                'phone': first_ticket.phone_number,
            },
            'MEDIA_URL': settings.MEDIA_URL,
            'logo_base64': LOGO_BASE64,
            'STATIC_URL': settings.STATIC_URL,
            'qr_data_url': qr_data_url,
            'request': request,
        })

        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html_string, dest=pdf_buffer)

        if pisa_status.err:
            logger.error(f'Błąd przy generowaniu PDF dla zamówienia {order_number}')
            return HttpResponse('Błąd przy generowaniu PDF', status=500)

        response = HttpResponse(
            pdf_buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = (
            f'attachment; filename="tickets_{order_number}.pdf"'
        )

        return response



class ScreeningSeatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        screening = get_object_or_404(Screening, id=pk)
        seats = Seat.objects.filter(auditorium=screening.auditorium)

        sold_seat_ids = set(
            Ticket.objects.filter(screening=screening)
            .values_list("seats__id", flat=True)
        )

        rows = {}
        for seat in seats:
            row_key = seat.row_number
            if row_key not in rows:
                rows[row_key] = []

            rows[row_key].append({
                "id": seat.id,
                "row_number": seat.row_number,
                "seat_number": seat.seat_number,
                "reserved": seat.id in sold_seat_ids,
            })

        return Response(rows)


class InstantPurchaseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        input_serializer = InstantPurchaseSerializer(
            data=request.data,
            context={'request': request}
        )
        input_serializer.is_valid(raise_exception=True)
        tickets = input_serializer.save()
        tickets_serializer = InstantPurchaseResponseSerializer(tickets, many=True)

        group_order_number = tickets[0].order_number

        total_price = sum(t.total_price for t in tickets)
        first_ticket = tickets[0]
        customer_info = {
            "loggedIn": first_ticket.user is not None,
            "first_name": first_ticket.first_name,
            "last_name": first_ticket.last_name,
            "email": first_ticket.email,
            "phone": first_ticket.phone_number,
        }

        response_data = {
            "order_number": group_order_number,
            "purchase_time": first_ticket.purchased_at,
            "customer_info": customer_info,
            "tickets": tickets_serializer.data,
            "total_price": total_price
        }

        return Response(response_data, status=status.HTTP_201_CREATED)


class PromotionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        promotions = PromotionRule.objects.all()
        screening_id = request.query_params.get("screening_id")
        ticket_type_id = request.query_params.get("ticket_type_id")

        promotions = [p for p in promotions if p.is_active()]

        if screening_id:
            try:
                screening = Screening.objects.get(id=screening_id)
                promotions = [p for p in promotions if not p.screening or p.screening == screening]
            except Screening.DoesNotExist:
                return Response({"error": "Seans nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

        if ticket_type_id:
            try:
                ticket_type = TicketType.objects.get(id=ticket_type_id)
                promotions = [p for p in promotions if not p.ticket_type or p.ticket_type == ticket_type]
            except TicketType.DoesNotExist:
                return Response({"error": "Typ biletu nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PromotionRuleSerializer(promotions, many=True)
        return Response(serializer.data)


class TicketsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Ticket.objects.all().select_related('screening__movie', 'type').prefetch_related('seats')
        # Apply django-filters FilterSet manually within APIView
        filterset = TicketFilter(request.query_params, queryset=qs)
        qs = filterset.qs

        # Build lightweight payload for dashboard/analytics
        data = []
        for t in qs:
            data.append({
                'id': t.id,
                'order_number': t.order_number,
                'purchased_at': t.purchased_at,
                'total_price': str(t.total_price),
                'payment_status': t.payment_status,
                'type': t.type.name if t.type_id else None,
                'screening_id': t.screening_id,
                'movie_title': getattr(getattr(t.screening, 'movie', None), 'title', None),
                'seats_count': t.seats.count(),
                'user_id': t.user_id,
            })

        return Response(data)
