from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


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
