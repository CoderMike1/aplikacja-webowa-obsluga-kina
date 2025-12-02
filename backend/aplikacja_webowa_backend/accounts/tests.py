from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta

from auditorium.models import Auditorium, Seat
from movies.models import Movie, Genre
from screenings.models import Screening, ProjectionType
from tickets.models import TicketType, Ticket


class RegisterAPITests(APITestCase):
	def test_register_user_success(self):
		url = reverse('register')
		data = {
			'username': 'jan',
			'email': 'jan@example.com',
			'password': 'SuperTajneHaslo1!',
			'first_name': 'Jan',
			'last_name': 'Kowalski',
			'phone': '123456789',
			'bio': 'Cześć',
			'location_country': 'Poland',
			'location_city': 'Warsaw',
			'two_factor_enabled': False,
		}
		resp = self.client.post(url, data, format='json')
		self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
		# New contract: access token in body, refresh in HttpOnly cookie
		self.assertIn('access', resp.data)
		self.assertIn('refresh_token', resp.cookies)

		User = get_user_model()
		self.assertTrue(User.objects.filter(email='jan@example.com').exists())

	def test_register_user_conflict_email_username_phone(self):
		User = get_user_model()
		User.objects.create_user(email='dupe@example.com', username='dupe', password='Password123!', phone='555777999')

		url = reverse('register')
		# duplicate email
		resp_email = self.client.post(url, {
			'username': 'x1', 'email': 'dupe@example.com', 'password': 'Password123!'
		}, format='json')
		self.assertEqual(resp_email.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('email', resp_email.data)

		# duplicate username
		resp_username = self.client.post(url, {
			'username': 'dupe', 'email': 'new@example.com', 'password': 'Password123!'
		}, format='json')
		self.assertEqual(resp_username.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('username', resp_username.data)

		# duplicate phone
		resp_phone = self.client.post(url, {
			'username': 'x2', 'email': 'another@example.com', 'password': 'Password123!', 'phone': '555777999'
		}, format='json')
		self.assertEqual(resp_phone.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('phone', resp_phone.data)

	def test_register_requires_minimal_fields(self):
		url = reverse('register')
		resp = self.client.post(url, {}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('username', resp.data)
		self.assertIn('email', resp.data)
		self.assertIn('password', resp.data)


class LoginAPITests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(
			email='jan@example.com', username='jan', password='SuperTajneHaslo1!'
		)

	def test_login_with_username(self):
		url = reverse('login')
		data = { 'username': 'jan', 'password': 'SuperTajneHaslo1!' }
		resp = self.client.post(url, data, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		self.assertIn('access', resp.data)
		self.assertIn('refresh_token', resp.cookies)

	def test_login_with_email_only(self):
		url = reverse('login')
		data = { 'email': 'jan@example.com', 'password': 'SuperTajneHaslo1!' }
		resp = self.client.post(url, data, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)

	def test_login_invalid_credentials(self):
		url = reverse('login')
		data = { 'username': 'jan', 'password': 'WrongPassword!' }
		resp = self.client.post(url, data, format='json')
		self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class JWTEndpointsTests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(
			email='anna@example.com', username='anna', password='Password123!'
		)

	def test_token_obtain_pair(self):
		url = reverse('token_obtain_pair')
		resp = self.client.post(url, { 'username': 'anna', 'password': 'Password123!' }, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		# Custom view strips refresh from body, sets cookie
		self.assertIn('access', resp.data)
		self.assertNotIn('refresh', resp.data)
		self.assertIn('refresh_token', resp.cookies)

	def test_token_refresh(self):
		# obtain initial tokens (refresh cookie set)
		obtain_url = reverse('token_obtain_pair')
		obtain_resp = self.client.post(obtain_url, { 'username': 'anna', 'password': 'Password123!' }, format='json')
		self.assertEqual(obtain_resp.status_code, status.HTTP_200_OK)
		self.assertIn('refresh_token', obtain_resp.cookies)
		# simulate browser sending cookie
		self.client.cookies['refresh_token'] = obtain_resp.cookies['refresh_token'].value
		refresh_url = reverse('token_refresh')
		refresh_resp = self.client.post(refresh_url, {}, format='json')
		self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
		self.assertIn('access', refresh_resp.data)


class CustomUserManagerTests(APITestCase):
	def test_create_user_requires_email_and_username(self):
		User = get_user_model()
		with self.assertRaises(ValueError):
			User.objects.create_user(email='', username='x', password='p')
		with self.assertRaises(ValueError):
			User.objects.create_user(email='a@example.com', username='', password='p')

	def test_create_superuser_flags(self):
		User = get_user_model()
		# Correct case
		su = User.objects.create_superuser(email='admin@example.com', username='admin', password='AdminPass123!')
		self.assertTrue(su.is_staff)
		self.assertTrue(su.is_superuser)

		# Validation of flags via extra_fields
		with self.assertRaises(ValueError):
			User.objects.create_superuser(email='x@example.com', username='x', password='AdminPass123!', is_staff=False)
		with self.assertRaises(ValueError):
			User.objects.create_superuser(email='y@example.com', username='y', password='AdminPass123!', is_superuser=False)


class ProfileAPITests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(
			email='user@example.com', username='user', password='Password123!'
		)
		self.client.force_authenticate(self.user)

	def test_get_profile(self):
		url = reverse('user_profile')
		resp = self.client.get(url)
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		self.assertEqual(resp.data['email'], 'user@example.com')
		self.assertEqual(resp.data['username'], 'user')

	def test_patch_profile_updates_fields(self):
		url = reverse('user_profile')
		payload = {
			'first_name': 'Jan',
			'last_name': 'Kowalski',
			'phone': '123456789',
			'two_factor_enabled': True,
		}
		resp = self.client.patch(url, payload, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		self.assertEqual(resp.data['first_name'], 'Jan')
		self.assertEqual(resp.data['last_name'], 'Kowalski')
		self.assertEqual(resp.data['phone'], '123456789')
		self.assertTrue(resp.data['two_factor_enabled'])

	def test_patch_profile_unique_email_conflict(self):
		User = get_user_model()
		User.objects.create_user(email='taken@example.com', username='taken', password='x')
		url = reverse('user_profile')
		resp = self.client.patch(url, {'email': 'taken@example.com'}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('email', resp.data)

	def test_avatar_config_endpoint(self):
		url = reverse('avatar_upload_config')
		resp = self.client.get(url)
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		self.assertIn('cloud_name', resp.data)
		self.assertIn('upload_preset', resp.data)
		self.assertIn('allowed_domain', resp.data)

	def test_patch_profile_avatar_allowed_domain(self):
		url = reverse('user_profile')
		# Allowed domains default to res.cloudinary.com; use a typical Cloudinary URL
		avatar_url = 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
		resp = self.client.patch(url, {'avatar': avatar_url}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		self.assertEqual(resp.data.get('avatar'), avatar_url)

	def test_patch_profile_avatar_disallowed_domain(self):
		url = reverse('user_profile')
		bad_url = 'https://example.com/files/avatar.jpg'
		resp = self.client.patch(url, {'avatar': bad_url}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('avatar', resp.data)


class ChangePasswordAPITests(APITestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(
			email='pwd@example.com', username='pwd', password='OldPass123!'
		)
		self.client.force_authenticate(self.user)

	def test_change_password_success(self):
		url = reverse('change_password')
		resp = self.client.post(url, {
			'current_password': 'OldPass123!',
			'new_password': 'NewPass123!'
		}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		# old password should fail, new should pass
		self.client.force_authenticate(None)
		login_resp_old = self.client.post(reverse('login'), {
			'username': 'pwd', 'password': 'OldPass123!'
		}, format='json')
		self.assertEqual(login_resp_old.status_code, status.HTTP_401_UNAUTHORIZED)
		login_resp_new = self.client.post(reverse('login'), {
			'username': 'pwd', 'password': 'NewPass123!'
		}, format='json')
		self.assertEqual(login_resp_new.status_code, status.HTTP_200_OK)

	def test_change_password_wrong_current(self):
		url = reverse('change_password')
		resp = self.client.post(url, {
			'current_password': 'WrongOld!',
			'new_password': 'NewPass123!'
		}, format='json')
		self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class MyTicketsAPITests(APITestCase):
	def setUp(self):
		# Users
		User = get_user_model()
		self.user = User.objects.create_user(email='t1@example.com', username='t1', password='Password123!')
		self.other = User.objects.create_user(email='t2@example.com', username='t2', password='Password123!')

		# Auditorium & seats
		self.aud = Auditorium.objects.create(name='Testowa')
		self.seat1 = Seat.objects.create(auditorium=self.aud, row_number=0, seat_number=0)
		self.seat2 = Seat.objects.create(auditorium=self.aud, row_number=0, seat_number=1)

		# Movie & projection type & screening
		genre = Genre.objects.create(name='Drama')
		movie = Movie.objects.create(
			title='Film X', original_title='Film X', description='Desc',
			release_date=timezone.now().date(), cinema_release_date=timezone.now().date(),
			duration_minutes=100, directors='Dir', poster_path='poster.jpg', is_special_event=False
		)
		movie.genres.add(genre)
		ptype = ProjectionType.objects.create(name='2D')
		# Align time to next 10-minute mark, seconds=0
		now = timezone.now()
		minute = (now.minute // 10 + 1) * 10
		aligned = now.replace(minute=0, second=0, microsecond=0) + timedelta(minutes=minute)
		self.screening = Screening.objects.create(
			movie=movie, auditorium=self.aud, projection_type=ptype,
			start_time=aligned, published_at=now
		)

		# Ticket types
		self.ttype = TicketType.objects.create(name='Normalny', price=30.0)

		# Tickets for user and other user
		self.t_user_1 = Ticket.objects.create(user=self.user, screening=self.screening, type=self.ttype, total_price=30.0)
		self.t_user_1.seats.set([self.seat1])
		self.t_user_2 = Ticket.objects.create(user=self.user, screening=self.screening, type=self.ttype, total_price=60.0)
		self.t_user_2.seats.set([self.seat1, self.seat2])
		self.t_other = Ticket.objects.create(user=self.other, screening=self.screening, type=self.ttype, total_price=30.0)
		self.t_other.seats.set([self.seat2])

		self.client.force_authenticate(self.user)

	def test_requires_auth(self):
		self.client.force_authenticate(None)
		url = reverse('my_tickets')
		resp = self.client.get(url)
		self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_lists_only_my_tickets(self):
		url = reverse('my_tickets')
		resp = self.client.get(url)
		self.assertEqual(resp.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(len(resp.data), 2)
		# ensure tickets belong to self.user
		for item in resp.data:
			self.assertIn('ticket_type', item)
			self.assertIn('seats', item)
		# other user's ticket should not be included
		self.assertTrue(all(item['screening']['id'] == self.screening.id for item in resp.data))
