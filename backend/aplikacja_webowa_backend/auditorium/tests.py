from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Auditorium, Seat


class AuditoriumAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username='admin', email='admin@example.com', password='adminpass', is_staff=True, is_superuser=True
        )
        self.user = User.objects.create_user(
            username='user', email='user@example.com', password='userpass', is_staff=False
        )
        self.admin_client = APIClient(); self.admin_client.force_authenticate(self.admin)
        self.user_client = APIClient(); self.user_client.force_authenticate(self.user)

    def test_list_auditoriums_empty(self):
        url = reverse('auditorium-list')
        resp = self.admin_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_admin_create_auditorium(self):
        url = reverse('auditorium-list')
        resp = self.admin_client.post(url, {'name': 'Sala 1'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], 'Sala 1')

    def test_non_admin_cannot_create_auditorium(self):
        url = reverse('auditorium-list')
        resp = self.user_client.post(url, {'name': 'Sala 2'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_auditorium_detail(self):
        a = Auditorium.objects.create(name='Sala Detail')
        url = reverse('auditorium-detail', args=[a.id])
        resp = self.admin_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Sala Detail')

    def test_get_auditorium_detail_404(self):
        url = reverse('auditorium-detail', args=[999999])
        resp = self.admin_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_auditorium_name(self):
        a = Auditorium.objects.create(name='Old Name')
        url = reverse('auditorium-detail', args=[a.id])
        resp = self.admin_client.patch(url, {'name': 'New Name'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'New Name')

    def test_put_auditorium_name(self):
        a = Auditorium.objects.create(name='Put Old')
        url = reverse('auditorium-detail', args=[a.id])
        resp = self.admin_client.put(url, {'name': 'Put New'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Put New')

    def test_delete_auditorium_admin(self):
        a = Auditorium.objects.create(name='Delete Me')
        url = reverse('auditorium-detail', args=[a.id])
        resp = self.admin_client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Auditorium.objects.filter(pk=a.id).exists())

    def test_non_admin_cannot_modify_auditorium(self):
        a = Auditorium.objects.create(name='No Change')
        url = reverse('auditorium-detail', args=[a.id])
        resp_patch = self.user_client.patch(url, {'name': 'Hack'}, format='json')
        self.assertEqual(resp_patch.status_code, status.HTTP_403_FORBIDDEN)
        resp_delete = self.user_client.delete(url)
        self.assertEqual(resp_delete.status_code, status.HTTP_403_FORBIDDEN)

    def test_unique_name_on_create(self):
        Auditorium.objects.create(name='Sala Uniq')
        url = reverse('auditorium-list')
        resp = self.admin_client.post(url, {'name': 'Sala Uniq'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', resp.data)

    def test_unique_name_on_patch(self):
        a1 = Auditorium.objects.create(name='Sala A')
        a2 = Auditorium.objects.create(name='Sala B')
        url = reverse('auditorium-detail', args=[a2.id])
        resp = self.admin_client.patch(url, {'name': 'Sala A'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', resp.data)


class SeatAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username='admin', email='admin@example.com', password='adminpass', is_staff=True, is_superuser=True
        )
        self.user = User.objects.create_user(
            username='user', email='user@example.com', password='userpass', is_staff=False
        )
        self.admin_client = APIClient(); self.admin_client.force_authenticate(self.admin)
        self.user_client = APIClient(); self.user_client.force_authenticate(self.user)
        self.a1 = Auditorium.objects.create(name='Sala 1')
        self.a2 = Auditorium.objects.create(name='Sala 2')

    def test_list_seats_empty(self):
        url = reverse('auditorium-seats')
        resp = self.admin_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_admin_create_seat(self):
        url = reverse('auditorium-seats')
        payload = {'auditorium_id': self.a1.id, 'row_number': 1, 'seat_number': 2}
        resp = self.admin_client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['row_number'], 1)
        self.assertEqual(resp.data['seat_number'], 2)
        self.assertEqual(resp.data['auditorium']['name'], 'Sala 1')

    def test_non_admin_cannot_create_seat(self):
        url = reverse('auditorium-seats')
        resp = self.user_client.post(url, {'auditorium_id': self.a1.id, 'row_number': 0, 'seat_number': 0}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Seat.objects.filter(auditorium=self.a1).count(), 0)

    def test_seat_uniqueness_on_create(self):
        Seat.objects.create(auditorium=self.a1, row_number=5, seat_number=6)
        url = reverse('auditorium-seats')
        resp = self.admin_client.post(url, {'auditorium_id': self.a1.id, 'row_number': 5, 'seat_number': 6}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', resp.data)

    def test_get_seat_detail(self):
        seat = Seat.objects.create(auditorium=self.a1, row_number=2, seat_number=3)
        url = reverse('seat-detail', args=[seat.id])
        resp = self.admin_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['id'], seat.id)
        self.assertEqual(resp.data['auditorium']['name'], 'Sala 1')

    def test_get_seat_detail_404(self):
        url = reverse('seat-detail', args=[999999])
        resp = self.admin_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_seat(self):
        seat = Seat.objects.create(auditorium=self.a1, row_number=1, seat_number=1)
        url = reverse('seat-detail', args=[seat.id])
        resp = self.admin_client.patch(url, {'row_number': 9}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['row_number'], 9)

    def test_put_seat(self):
        seat = Seat.objects.create(auditorium=self.a1, row_number=4, seat_number=4)
        url = reverse('seat-detail', args=[seat.id])
        resp = self.admin_client.put(url, {'auditorium_id': self.a1.id, 'row_number': 7, 'seat_number': 8}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['row_number'], 7)
        self.assertEqual(resp.data['seat_number'], 8)

    def test_seat_patch_uniqueness_conflict(self):
        Seat.objects.create(auditorium=self.a1, row_number=1, seat_number=2)
        seat = Seat.objects.create(auditorium=self.a1, row_number=3, seat_number=4)
        url = reverse('seat-detail', args=[seat.id])
        resp = self.admin_client.patch(url, {'row_number': 1, 'seat_number': 2}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', resp.data)

    def test_delete_seat(self):
        seat = Seat.objects.create(auditorium=self.a1, row_number=3, seat_number=5)
        url = reverse('seat-detail', args=[seat.id])
        resp = self.admin_client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Seat.objects.filter(pk=seat.id).exists())

    def test_non_admin_cannot_modify_seat(self):
        seat = Seat.objects.create(auditorium=self.a1, row_number=0, seat_number=1)
        url = reverse('seat-detail', args=[seat.id])
        resp_patch = self.user_client.patch(url, {'row_number': 8}, format='json')
        self.assertEqual(resp_patch.status_code, status.HTTP_403_FORBIDDEN)
        resp_delete = self.user_client.delete(url)
        self.assertEqual(resp_delete.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Seat.objects.filter(pk=seat.id).exists())

    def test_negative_row_number_validation(self):
        url = reverse('auditorium-seats')
        resp = self.admin_client.post(url, {'auditorium_id': self.a1.id, 'row_number': -1, 'seat_number': 0}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('row_number', resp.data)

    def test_negative_seat_number_validation(self):
        url = reverse('auditorium-seats')
        resp = self.admin_client.post(url, {'auditorium_id': self.a1.id, 'row_number': 0, 'seat_number': -2}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('seat_number', resp.data)
