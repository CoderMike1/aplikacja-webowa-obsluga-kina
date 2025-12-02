from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Max
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
    help = (
        "Seed seats for each auditorium (~30 per sala) with varied layouts, "
        "optionally appending additional seats as new rows."
    )

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
        parser.add_argument(
            '--append', type=int, default=0,
            help='Append this many additional seats per auditorium as new rows (keeps existing seats).'
        )
        parser.add_argument(
            '--per-row', type=int, default=10,
            help='Seats per newly added row when using --append.'
        )
        parser.add_argument(
            '--extend-rows', type=int, default=0,
            help='Add this many seats to each existing row in each auditorium.'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        limit = options['limit']
        to_append = options['append']
        per_row = options['per_row']
        extend_rows = options['extend_rows']

        auditoriums_qs = Auditorium.objects.all().order_by('name')
        if limit is not None:
            auditoriums_qs = auditoriums_qs[:limit]

        created_total = 0
        skipped = []
        modified = []
        for idx, auditorium in enumerate(auditoriums_qs):
            pattern = SEAT_PATTERNS[idx % len(SEAT_PATTERNS)]
            existing_count = auditorium.seats.count()

            # If extending rows, add N seats to each existing row
            if extend_rows > 0 and existing_count > 0:
                if dry_run:
                    modified.append(
                        f"{auditorium.name}: would add {extend_rows} seats to each existing row"
                    )
                    continue

                with transaction.atomic():
                    rows_data = auditorium.seats.values('row_number').annotate(
                        max_seat=Max('seat_number')
                    )
                    added = 0
                    for row_info in rows_data:
                        row_num = row_info['row_number']
                        max_seat = row_info['max_seat']
                        start_seat = max_seat + 1
                        for i in range(extend_rows):
                            Seat.objects.create(
                                auditorium=auditorium,
                                row_number=row_num,
                                seat_number=start_seat + i
                            )
                            added += 1
                created_total += added
                modified.append(
                    f"{auditorium.name}: added {extend_rows} seats to each of {rows_data.count()} rows (total +{added})"
                )
                continue

            # If appending only, keep existing seats and add more after current max row
            if to_append > 0 and not force and existing_count > 0:
                if dry_run:
                    modified.append(
                        f"{auditorium.name}: would append {to_append} seats in rows of {per_row} after existing {existing_count}"
                    )
                    continue

                with transaction.atomic():
                    max_row = auditorium.seats.aggregate(m=Max('row_number'))['m']
                    # 1-based rows: start at 1 when none, otherwise next after max
                    start_row = 1 if max_row is None else max_row + 1
                    remaining = to_append
                    row_index = start_row
                    while remaining > 0:
                        seats_in_this_row = min(per_row, remaining)
                        for seat_index in range(seats_in_this_row):
                            Seat.objects.create(
                                auditorium=auditorium,
                                row_number=row_index,
                                seat_number=seat_index + 1  # 1-based seats
                            )
                        remaining -= seats_in_this_row
                        row_index += 1
                created_total += to_append
                modified.append(
                    f"{auditorium.name}: appended {to_append} seats in rows of {per_row} (from row {start_row})"
                )
                continue

            # Default behavior: seed from scratch (or reseed with --force)
            if existing_count > 0 and not force:
                skipped.append(f"{auditorium.name}({existing_count} seats)")
                continue

            if dry_run:
                msg = f"{auditorium.name}: would create pattern {pattern} (total {sum(pattern)})"
                if to_append > 0:
                    msg += f" and then append {to_append} seats in rows of {per_row}"
                modified.append(msg)
                continue

            with transaction.atomic():
                if force and existing_count > 0:
                    auditorium.seats.all().delete()
                # 1-based row_number and seat_number
                for row_index, seats_in_row in enumerate(pattern):
                    for seat_index in range(seats_in_row):
                        Seat.objects.create(
                            auditorium=auditorium,
                            row_number=row_index + 1,
                            seat_number=seat_index + 1
                        )
                # Optionally append more after base pattern
                if to_append > 0:
                    start_row = len(pattern) + 1  # next 1-based row
                    remaining = to_append
                    row_index = start_row
                    while remaining > 0:
                        seats_in_this_row = min(per_row, remaining)
                        for seat_index in range(seats_in_this_row):
                            Seat.objects.create(
                                auditorium=auditorium,
                                row_number=row_index,
                                seat_number=seat_index + 1
                            )
                        remaining -= seats_in_this_row
                        row_index += 1
            created_total += sum(pattern) + (to_append if to_append > 0 else 0)
            if to_append > 0:
                modified.append(
                    f"{auditorium.name}: created {sum(pattern)} (pattern {pattern}) + appended {to_append} seats"
                )
            else:
                modified.append(
                    f"{auditorium.name}: created {sum(pattern)} seats in {len(pattern)} rows -> pattern {pattern}"
                )

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
