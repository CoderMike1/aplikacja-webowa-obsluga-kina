from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from screenings.models import Screening
from movies.models import Movie
from auditorium.models import Auditorium, Seat
from .models import Ticket, TicketType


class TicketsViewTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()

		# Users
		self.staff = User.objects.create_user(username='staff', email='staff@example.com', password='pass', is_staff=True)
		self.user = User.objects.create_user(username='user', email='user@example.com', password='pass', is_staff=False)

		# Domain data
		self.movie = Movie.objects.create(
			title='Test Movie',
			duration_minutes=120,
			release_date=timezone.now().date()
		)
		self.auditorium = Auditorium.objects.create(name='Sala 1')
		# Create some seats
		self.seat1 = Seat.objects.create(auditorium=self.auditorium, row_number=1, seat_number=1)
		self.seat2 = Seat.objects.create(auditorium=self.auditorium, row_number=1, seat_number=2)

		start_time = (timezone.now() + timedelta(days=1)).replace(minute=10, second=0, microsecond=0)
		self.screening = Screening.objects.create(
			movie=self.movie,
			auditorium=self.auditorium,
			start_time=start_time,
		)

		self.type_adult = TicketType.objects.create(name='Normalny', price=25.00)

		# Tickets
		self.ticket1 = Ticket.objects.create(
			user=self.user,
			screening=self.screening,
			type=self.type_adult,
			total_price=50.00,
			payment_status='PAID',
			first_name='Jan', last_name='Kowalski', email='jan@example.com'
		)
		self.ticket1.seats.add(self.seat1, self.seat2)

		# Second ticket, different status and date
		self.ticket2 = Ticket.objects.create(
			user=None,
			screening=self.screening,
			type=self.type_adult,
			total_price=25.00,
			payment_status='PENDING',
			first_name='Anna', last_name='Nowak', email='anna@example.com'
		)
		self.ticket2.seats.add(self.seat1)

		self.url = reverse('tickets-list')

	def test_requires_auth(self):
		resp = self.client.get(self.url)
		# Depending on DRF settings, could be 401 or 403; accept both
		self.assertIn(resp.status_code, (401, 403))

	def test_non_staff_forbidden(self):
		self.client.force_authenticate(user=self.user)
		resp = self.client.get(self.url)
		self.assertEqual(resp.status_code, 403)

	def test_staff_can_list_tickets(self):
		self.client.force_authenticate(user=self.staff)
		resp = self.client.get(self.url)
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertTrue(isinstance(data, list))
		self.assertGreaterEqual(len(data), 2)
		# Validate payload keys
		item = data[0]
		for key in ['id', 'order_number', 'purchased_at', 'total_price', 'payment_status', 'screening_id']:
			self.assertIn(key, item)

	def test_filters_payment_status(self):
		self.client.force_authenticate(user=self.staff)
		resp = self.client.get(self.url, {'payment_status': 'PAID'})
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertTrue(all(d['payment_status'] == 'PAID' for d in data))

	def test_filters_date_range(self):
		self.client.force_authenticate(user=self.staff)
		# future window that should include both tickets (auto_now_add close to now)
		start = (timezone.now() - timedelta(days=1)).isoformat()
		end = (timezone.now() + timedelta(days=1)).isoformat()
		resp = self.client.get(self.url, {'purchased_at_after': start, 'purchased_at_before': end})
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertGreaterEqual(len(data), 2)

# Create your tests here.
