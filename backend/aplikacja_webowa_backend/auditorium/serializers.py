from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Auditorium, Seat


class AuditoriumReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auditorium
        fields = ["id", "name"]


class AuditoriumWriteSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=255,
        validators=[UniqueValidator(queryset=Auditorium.objects.all(), message="Sala o tej nazwie już istnieje.")],
    )

    class Meta:
        model = Auditorium
        fields = ["name"]

class SeatReadSerializer(serializers.ModelSerializer):
    auditorium = AuditoriumReadSerializer(read_only=True)

    class Meta:
        model = Seat
        fields = ["id", "auditorium", "row_number", "seat_number"]


class SeatWriteSerializer(serializers.ModelSerializer):
    row_number = serializers.IntegerField(min_value=1)
    seat_number = serializers.IntegerField(min_value=1)
    auditorium_id = serializers.PrimaryKeyRelatedField(
        queryset=Auditorium.objects.all(), source='auditorium', write_only=True, required=True)

    class Meta:
        model = Seat
        fields = ["row_number", "seat_number", "auditorium_id"]

    def validate(self, attrs):
        row_number = attrs.get('row_number', getattr(self.instance, 'row_number', None))
        seat_number = attrs.get('seat_number', getattr(self.instance, 'seat_number', None))
        auditorium = attrs.get('auditorium', getattr(self.instance, 'auditorium', None))
        if auditorium is not None and row_number is not None and seat_number is not None:
            qs = Seat.objects.filter(auditorium=auditorium, row_number=row_number, seat_number=seat_number)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'non_field_errors': ['Miejsce o tym numerze w tej sali już istnieje.']})
        return attrs

    
