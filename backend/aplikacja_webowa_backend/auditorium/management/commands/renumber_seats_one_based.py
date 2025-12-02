from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Min
from auditorium.models import Auditorium, Seat


class Command(BaseCommand):
    help = "Renumber all seats to 1-based indexing (row_number, seat_number start from 1)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would be changed without modifying the database.'
        )
        parser.add_argument(
            '--limit', type=int, default=None,
            help='Optional maximum number of auditoriums to process (after sorting by name).'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        limit = options['limit']

        auditoriums = Auditorium.objects.all().order_by('name')
        if limit is not None:
            auditoriums = auditoriums[:limit]

        changed_total = 0
        skipped = []
        modified = []

        for aud in auditoriums:
            agg = aud.seats.aggregate(min_row=Min('row_number'), min_seat=Min('seat_number'))
            min_row = agg['min_row']
            min_seat = agg['min_seat']
            if min_row is None:
                skipped.append(f"{aud.name}: no seats")
                continue

            needs_row_fix = (min_row == 0)
            needs_seat_fix = (min_seat == 0)

            if not needs_row_fix and not needs_seat_fix:
                skipped.append(f"{aud.name}: already 1-based")
                continue

            qs = aud.seats.all()
            count = qs.count()
            if dry_run:
                modified.append(
                    f"{aud.name}: would renumber {count} seats to 1-based (row +{1 if needs_row_fix else 0}, seat +{1 if needs_seat_fix else 0})"
                )
                continue

            with transaction.atomic():
                # Safe to update in-place; mapping is injective (+1) so no collisions
                for seat in qs.select_for_update():
                    if needs_row_fix:
                        seat.row_number = seat.row_number + 1
                    if needs_seat_fix:
                        seat.seat_number = seat.seat_number + 1
                    seat.save(update_fields=['row_number', 'seat_number'])

            changed_total += count
            modified.append(
                f"{aud.name}: renumbered {count} seats to 1-based"
            )

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run: no changes committed.'))

        for line in modified:
            self.stdout.write(self.style.SUCCESS(line))

        if skipped:
            self.stdout.write(self.style.HTTP_INFO('Skipped: ' + ', '.join(skipped)))

        self.stdout.write(self.style.SUCCESS(f'Total seats affected: {changed_total}'))
        self.stdout.write(self.style.SUCCESS('Renumbering complete.'))
