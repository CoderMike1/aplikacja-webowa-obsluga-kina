import base64
import os
from django.utils.html import escape
import qrcode
from io import BytesIO
from django.conf import settings
from .templates.tickets.logo_base64 import LOGO_BASE64
from xhtml2pdf import pisa
from django.http import HttpResponse
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.template.loader import render_to_string
def make_qr_data_url(payload: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return f"data:image/png;base64,{b64}"


def generate_pdf_file(tickets,order_number,request):

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
        return HttpResponse('Błąd przy generowaniu PDF', status=500)

    return pdf_buffer

def send_email(tickets,order_number,request):
    pdf_buffer = generate_pdf_file(tickets,order_number,request)

    pdf_bytes = pdf_buffer.getvalue()

    def e(v):
        return escape("" if v is None else str(v))

    first_ticket = tickets.first()
    tickets_rows_html = ""
    for t in tickets:
        for s in t.seats.all():
            tickets_rows_html += f"""
            <tr>
              <td style="padding: 10px 0;">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 2px;">Bilet</div>
                <div style="color:#374151; font-size: 14px;">
                  Rząd {e(s.row_number)} • Miejsce {e(s.seat_number)}
                  {f' • {e(t.type.name)}'}
                </div>
              </td>
              <td style="padding: 10px 0; text-align:right; font-weight:700; white-space:nowrap;">
                {e(t.total_price)}zł
              </td>
            </tr>
            """
    movie_title = first_ticket.screening.movie
    customer_full_name = f"{first_ticket.first_name} {first_ticket.last_name}"
    customer_email = first_ticket.email
    customer_phone = first_ticket.phone_number
    total_paid = first_ticket.total_price



    html_body = f"""
    <!doctype html>
    <html lang="pl">
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:720px;margin:0 auto;padding:24px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <div style="padding:28px 28px 16px 28px;border-top:6px solid #1d4ed8;">
              <div style="font-size:28px;font-weight:800;color:#111827;line-height:1.2;">
                Podsumowanie zamówienia
              </div>
              <div style="margin-top:10px;color:#6b7280;font-size:14px;">
                Zamówienie: <strong style="color:#111827;">{e(order_number)}</strong>
              </div>
            </div>

            <div style="padding:0 28px 18px 28px;">
              <div style="font-size:26px;font-weight:800;color:#111827;margin-top:6px;">
                {e(movie_title)}
              </div>
            </div>
            <div style="padding:0 28px 8px 28px;">
              <table style="width:100%;border-collapse:collapse;">
                {tickets_rows_html}
              </table>
            </div>

            <div style="padding:12px 28px 0 28px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0 14px 0;">
            </div>

            <div style="padding:0 28px 18px 28px;">
              <div style="font-size:22px;font-weight:800;color:#111827;margin-top:6px;">
                Dane kontaktowe
              </div>

              <div style="margin-top:10px;color:#111827;font-size:16px;">
                <div style="margin:6px 0;"><strong>Imię i nazwisko:</strong> {e(customer_full_name)}</div>
                <div style="margin:6px 0;"><strong>E-mail:</strong> {e(customer_email)}</div>
                <div style="margin:6px 0;"><strong>Numer telefonu:</strong> {e(customer_phone)}</div>
              </div>

              <div style="margin-top:18px;color:#111827;font-size:16px;display:flex;justify-content:space-between;">
                <div style="color:#6b7280;">Opłata serwisowa: </div>
                <div style="font-weight:700;"> 0zł</div>
              </div>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">

              <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                <div style="font-size:20px;font-weight:800;color:#111827;">
                  Łącznie zapłacono: 
                </div>
                <div style="font-size:22px;font-weight:900;color:#dc2626;">
                  {e(total_paid)}zł
                </div>
              </div>

              <div style="margin-top:18px;color:#374151;font-size:14px;line-height:1.5;">
                W załączniku przesyłamy bilety w formacie PDF. Jeśli masz pytania, odpowiedz na tę wiadomość.
              </div>
            </div>

            <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
              Wiadomość wygenerowana automatycznie. Prosimy nie usuwać załącznika — zawiera bilety.
            </div>
          </div>
        </div>
      </body>
    </html>
    """

    msg = EmailMultiAlternatives(
        subject=f"Bilety – zamówienie {order_number}",
        body=None,
        from_email=os.getenv("FROM_EMAIL_ADDRESS"),
        to=[customer_email],
    )

    msg.attach_alternative(html_body, "text/html")

    msg.attach(
        filename=f"tickets_{order_number}.pdf",
        content=pdf_bytes,
        mimetype="application/pdf",
    )

    msg.send(fail_silently=False)


    pass