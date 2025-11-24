from django.core.management.base import BaseCommand
from django.db import transaction
from auditorium.models import Auditorium, Seat

# Każdy wzorzec to lista: liczba siedzeń w danym rzędzie (row_number zaczyna od 1)
SEAT_PATTERNS = [
    [8, 8, 8, 6],            # 30
    [10, 10, 5, 5],          # 30
    [6, 6, 6, 6, 6],         # 30
    [12, 6, 12],             # 30
    [7, 7, 7, 4, 5],         # 30
    [9, 9, 6, 6],            # 30
    [5, 5, 5, 5, 5, 5],      # 30
    [11, 7, 7, 5],           # 30
    [8, 7, 8, 7],            # 30
    [10, 8, 4, 8],           # 30
]

class Command(BaseCommand):
    help = "Seed seats for each auditorium (~30 per sala) with varied and irregular layouts. Idempotent by default."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force', action='store_true',
            help='If provided, existing seats in each auditorium will be deleted before seeding.'
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would be created without modifying the database.'
        )
        parser.add_argument(
            '--limit', type=int, default=None,
            help='Optional maximum number of auditoriums to seed (after sorting by name).'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        limit = options['limit']

        auditoriums_qs = Auditorium.objects.all().order_by('name')
        if limit is not None:
            auditoriums_qs = auditoriums_qs[:limit]

        created_total = 0
        skipped = []
        modified = []

        for idx, auditorium in enumerate(auditoriums_qs):
            pattern = SEAT_PATTERNS[idx % len(SEAT_PATTERNS)]
            existing_count = auditorium.seats.count()

            if existing_count > 0 and not force:
                skipped.append(f"{auditorium.name}({existing_count} seats)")
                continue

            if dry_run:
                modified.append(f"{auditorium.name}: would create pattern {pattern} (total {sum(pattern)})")
                continue

            with transaction.atomic():
                if force and existing_count > 0:
                    auditorium.seats.all().delete()
                # Zero-based row_number and seat_number
                for row_index, seats_in_row in enumerate(pattern):
                    for seat_index in range(seats_in_row):
                        Seat.objects.create(
                            auditorium=auditorium,
                            row_number=row_index,
                            seat_number=seat_index
                        )
            created_total += sum(pattern)
            modified.append(f"{auditorium.name}: created {sum(pattern)} seats in {len(pattern)} rows -> pattern {pattern}")

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run: no changes committed.'))

        if modified:
            for line in modified:
                self.stdout.write(self.style.SUCCESS(line))
        else:
            self.stdout.write(self.style.NOTICE('No auditoriums processed.'))

        if skipped:
            self.stdout.write(self.style.HTTP_INFO('Skipped (already had seats, use --force to reseed): ' + ', '.join(skipped)))

        self.stdout.write(self.style.SUCCESS(f'Total seats created: {created_total}'))
        self.stdout.write(self.style.SUCCESS('Seat seeding complete.'))
