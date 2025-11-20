from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta

from django.contrib.auth import get_user_model

from movies.models import Movie
from auditorium.models import Auditorium
from .models import Screening
from .models import ProjectionType


class ScreeningPostTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.admin = User.objects.create_superuser(email='admin@example.com', username='admin', password='pass')
		# create minimal movie and auditorium
		self.movie = Movie.objects.create(
			title='Test Movie',
			original_title='',
			description='',
			release_date=timezone.now().date(),
			cinema_release_date=timezone.now().date(),
			duration_minutes=90,
		)
		self.auditorium = Auditorium.objects.create(name='Main Hall')

	def test_admin_can_create_screening(self):
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		base = timezone.now() + timedelta(days=1)
		# align to allowed minute step
		start = base.replace(second=0, microsecond=0, minute=20).isoformat()
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start,
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)

	def test_reject_screening_before_cinema_release_date(self):
		future_release = (timezone.now().date() + timedelta(days=7))
		movie_future = Movie.objects.create(
			title='Future Movie', original_title='', description='',
			release_date=future_release, cinema_release_date=future_release, duration_minutes=100
		)
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		# start 2 days before premiere
		start_time = (timezone.now() + timedelta(days=5)).replace(minute=20, second=0, microsecond=0)
		payload = {
			'movie_id': movie_future.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start_time.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertIn('start_time', resp.data)

	def test_accept_screening_on_cinema_release_date(self):
		future_release = (timezone.now().date() + timedelta(days=10))
		movie_future = Movie.objects.create(
			title='Future Movie 2', original_title='', description='',
			release_date=future_release, cinema_release_date=future_release, duration_minutes=110
		)
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		# start exactly at 10 days (date matches cinema_release_date); ensure future time
		start_time = (timezone.now() + timedelta(days=10)).replace(minute=30, second=0, microsecond=0)
		payload = {
			'movie_id': movie_future.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start_time.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)

	def test_post_published_at_defaults_now(self):
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		start = (timezone.now() + timedelta(days=1)).replace(minute=20, second=0, microsecond=0)
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)
		self.assertIn('published_at', resp.data)

	def test_post_published_at_in_past_rejected(self):
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		start = (timezone.now() + timedelta(days=1)).replace(minute=20, second=0, microsecond=0)
		past = (timezone.now() - timedelta(days=1)).replace(second=0, microsecond=0)
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start.isoformat(),
			'published_at': past.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertIn('published_at', resp.data)
		# ensure not created in DB
		self.assertFalse(Screening.objects.filter(movie=self.movie, auditorium=self.auditorium, start_time=start).exists())

	def test_conflict_on_same_start_and_auditorium(self):
		# create initial screening
		start_dt = timezone.now() + timedelta(days=2)
		# align to allowed minute step
		start_dt = start_dt.replace(second=0, microsecond=0, minute=20)
		Screening.objects.create(movie=self.movie, auditorium=self.auditorium, start_time=start_dt)

		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start_dt.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_start_time_in_past_rejected(self):
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		past = (timezone.now() - timedelta(days=1)).isoformat()
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': past,
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertIn('start_time', resp.data)

	def test_reject_if_start_too_soon_after_previous(self):
		# previous screening ends less than 30 minutes before proposed start
		prev_start = (timezone.now() + timedelta(hours=1)).replace(second=0, microsecond=0, minute=20)
		prev_movie = Movie.objects.create(
			title='Prev Movie', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60
		)
		prev = Screening.objects.create(movie=prev_movie, auditorium=self.auditorium, start_time=prev_start)

		# proposed start is 20 minutes after prev end (inside 30m buffer)
		# prev_end = prev_start + 60m; prev_end + 20m -> still invalid; minute 40 is allowed
		proposed_start = prev_start + timedelta(minutes=80)

		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': proposed_start.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_accept_if_start_exactly_30min_after_previous(self):
		prev_start = (timezone.now() + timedelta(hours=1)).replace(second=0, microsecond=0, minute=20)
		prev_movie = Movie.objects.create(
			title='Prev Movie 2', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60
		)
		prev = Screening.objects.create(movie=prev_movie, auditorium=self.auditorium, start_time=prev_start)

		# proposed start exactly prev_end + 30min -> allowed
		proposed_start = prev_start + timedelta(minutes=90)

		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': proposed_start.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)

	def test_reject_if_not_enough_gap_before_next(self):
		# next screening starts too soon after proposed end + 30min buffer
		next_start = (timezone.now() + timedelta(hours=4)).replace(second=0, microsecond=0, minute=20)
		next_movie = Movie.objects.create(
			title='Next Movie', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60
		)
		next_scr = Screening.objects.create(movie=next_movie, auditorium=self.auditorium, start_time=next_start)

		# proposed screening duration 120m -> proposed_end = proposed_start + 120m
		proposed_start = (timezone.now() + timedelta(hours=2)).replace(second=0, microsecond=0, minute=20)
		# proposed_end = +4h; buffer +30m => +4h30; next_start at +4h -> insufficient

		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		# create a movie with duration 120
		long_movie = Movie.objects.create(
			title='Long Movie', original_title='', description='', release_date=timezone.now().date(), duration_minutes=120
		)
		payload = {
			'movie_id': long_movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': proposed_start.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_accept_if_enough_gap_before_next(self):
		next_start = (timezone.now() + timedelta(hours=5)).replace(second=0, microsecond=0, minute=20)
		next_movie = Movie.objects.create(
			title='Next Movie 2', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60
		)
		next_scr = Screening.objects.create(movie=next_movie, auditorium=self.auditorium, start_time=next_start)

		proposed_start = (timezone.now() + timedelta(hours=2)).replace(second=0, microsecond=0, minute=20)
		long_movie = Movie.objects.create(
			title='Long Movie 2', original_title='', description='', release_date=timezone.now().date(), duration_minutes=120
		)
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		payload = {
			'movie_id': long_movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': proposed_start.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)

	def test_reject_start_time_before_published_at(self):
		"""start_time < published_at should be rejected."""
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		published_at = (timezone.now() + timedelta(days=3)).replace(minute=20, second=0, microsecond=0)
		start_time = (timezone.now() + timedelta(days=2)).replace(minute=20, second=0, microsecond=0)
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start_time.isoformat(),
			'published_at': published_at.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertIn('start_time', resp.data)

	def test_accept_start_time_equal_or_after_published_at(self):
		"""start_time >= published_at should be accepted."""
		self.client.force_authenticate(self.admin)
		url = '/api/screenings/'
		published_at = (timezone.now() + timedelta(days=2)).replace(minute=20, second=0, microsecond=0)
		start_time = (timezone.now() + timedelta(days=2, hours=2)).replace(minute=30, second=0, microsecond=0)
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': start_time.isoformat(),
			'published_at': published_at.isoformat(),
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)


class ScreeningDetailViewTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		User = get_user_model()
		self.admin = User.objects.create_superuser(email='admin@example.com', username='admin', password='pass')
		self.movie = Movie.objects.create(
			title='Detail Movie', original_title='', description='', release_date=timezone.now().date(), duration_minutes=90
		)
		self.auditorium = Auditorium.objects.create(name='Detail Hall')
		start = (timezone.now() + timedelta(days=1)).replace(minute=20, second=0, microsecond=0)
		self.screening = Screening.objects.create(movie=self.movie, auditorium=self.auditorium, start_time=start)
		self.url = f'/api/screenings/{self.screening.pk}/'

	def test_get_detail_ok(self):
		resp = self.client.get(self.url)
		self.assertEqual(resp.status_code, 200)
		self.assertEqual(resp.data['id'], self.screening.pk)
		self.assertIn('movie', resp.data)
		self.assertIn('auditorium', resp.data)

	def test_get_detail_not_found(self):
		resp = self.client.get('/api/screenings/999999/')
		self.assertEqual(resp.status_code, 404)

	def test_patch_requires_admin(self):
		pt = ProjectionType.objects.create(name='2D')
		resp = self.client.patch(self.url, {'projection_type_id': pt.pk}, format='json')
		self.assertEqual(resp.status_code, 401)

	def test_patch_projection_type_admin_ok(self):
		pt = ProjectionType.objects.create(name='3D')
		self.client.force_authenticate(self.admin)
		resp = self.client.patch(self.url, {'projection_type_id': pt.pk}, format='json')
		self.assertEqual(resp.status_code, 200)
		self.assertIsNotNone(resp.data['projection_type'])
		self.assertEqual(resp.data['projection_type']['id'], pt.pk)

	def test_put_requires_admin(self):
		new_start = (timezone.now() + timedelta(days=2)).replace(minute=30, second=0, microsecond=0)
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': new_start.isoformat(),
		}
		resp = self.client.put(self.url, payload, format='json')
		self.assertEqual(resp.status_code, 401)

	def test_put_admin_ok(self):
		new_start = (timezone.now() + timedelta(days=2)).replace(minute=30, second=0, microsecond=0)
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': new_start.isoformat(),
		}
		self.client.force_authenticate(self.admin)
		resp = self.client.put(self.url, payload, format='json')
		self.assertEqual(resp.status_code, 200)
		# verify DB updated
		self.screening.refresh_from_db()
		self.assertEqual(self.screening.start_time, new_start)

	def test_patch_movie_longer_breaks_next_gap(self):
		# Create a next screening that would conflict when current movie becomes longer
		next_start = (self.screening.start_time + timedelta(hours=2)).replace(second=0, microsecond=0)
		next_movie = Movie.objects.create(
			title='Next For Patch', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60
		)
		Screening.objects.create(movie=next_movie, auditorium=self.auditorium, start_time=next_start)

		# Patch only the movie to a longer one (120m); start_time/auditorium stay the same
		long_movie = Movie.objects.create(
			title='Longer Movie Patch', original_title='', description='', release_date=timezone.now().date(), duration_minutes=120
		)
		self.client.force_authenticate(self.admin)
		resp = self.client.patch(self.url, {'movie_id': long_movie.pk}, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_patch_projection_type_set_to_null(self):
		# First set a projection type, then remove it by sending null
		pt = ProjectionType.objects.create(name='IMAX')
		self.client.force_authenticate(self.admin)
		resp1 = self.client.patch(self.url, {'projection_type_id': pt.pk}, format='json')
		self.assertEqual(resp1.status_code, 200)
		self.assertIsNotNone(resp1.data['projection_type'])
		# Now remove it
		resp2 = self.client.patch(self.url, {'projection_type_id': None}, format='json')
		self.assertEqual(resp2.status_code, 200)
		self.assertIsNone(resp2.data['projection_type'])

	def test_patch_conflict_same_start_and_auditorium(self):
		# create another screening at a specific time
		conflict_time = (timezone.now() + timedelta(days=3)).replace(minute=20, second=0, microsecond=0)
		Screening.objects.create(movie=self.movie, auditorium=self.auditorium, start_time=conflict_time)

		self.client.force_authenticate(self.admin)
		resp = self.client.patch(self.url, {'start_time': conflict_time.isoformat()}, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_put_conflict_too_soon_after_previous(self):
		# previous screening ends less than 30 minutes before desired start
		prev_start = (timezone.now() + timedelta(hours=1)).replace(minute=20, second=0, microsecond=0)
		prev_movie = Movie.objects.create(title='Prev M', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60)
		Screening.objects.create(movie=prev_movie, auditorium=self.auditorium, start_time=prev_start)

		# desired start 20 minutes into the 30-minute buffer after prev end
		desired_start = prev_start + timedelta(minutes=80)  # allowed minute 40, but inside buffer
		payload = {
			'movie_id': self.movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': desired_start.isoformat(),
		}
		self.client.force_authenticate(self.admin)
		resp = self.client.put(self.url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_put_conflict_before_next_insufficient_gap(self):
		# next screening starts too soon after proposed end + 30 minutes
		next_start = (timezone.now() + timedelta(hours=4)).replace(minute=40, second=0, microsecond=0)
		next_movie = Movie.objects.create(title='Next M', original_title='', description='', release_date=timezone.now().date(), duration_minutes=60)
		Screening.objects.create(movie=next_movie, auditorium=self.auditorium, start_time=next_start)

		proposed_start = (timezone.now() + timedelta(hours=2)).replace(minute=20, second=0, microsecond=0)
		long_movie = Movie.objects.create(title='Long M', original_title='', description='', release_date=timezone.now().date(), duration_minutes=120)
		payload = {
			'movie_id': long_movie.pk,
			'auditorium_id': self.auditorium.pk,
			'start_time': proposed_start.isoformat(),
		}
		self.client.force_authenticate(self.admin)
		resp = self.client.put(self.url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)

	def test_delete_requires_admin(self):
		resp = self.client.delete(self.url)
		self.assertEqual(resp.status_code, 401)

	def test_delete_admin_ok(self):
		self.client.force_authenticate(self.admin)
		resp = self.client.delete(self.url)
		self.assertEqual(resp.status_code, 204)
		self.assertFalse(Screening.objects.filter(pk=self.screening.pk).exists())

	def test_patch_auditorium_conflict_same_start(self):
		# Create another auditorium and an existing screening there at the same time
		other_hall = Auditorium.objects.create(name='Other Hall')
		Screening.objects.create(movie=self.movie, auditorium=other_hall, start_time=self.screening.start_time)
		self.client.force_authenticate(self.admin)
		resp = self.client.patch(self.url, {'auditorium_id': other_hall.pk}, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertTrue('non_field_errors' in resp.data or 'detail' in resp.data)


