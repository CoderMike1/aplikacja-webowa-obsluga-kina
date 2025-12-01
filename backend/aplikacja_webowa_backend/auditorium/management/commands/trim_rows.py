from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Max
from auditorium.models import Auditorium, Seat


class Command(BaseCommand):
    help = "Trim seats to keep only first N rows per auditorium (deletes higher row_number seats)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-rows', type=int, required=True,
            help='Number of rows to keep (0-based: 0..N-1).'
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would be deleted without modifying the database.'
        )

    def handle(self, *args, **options):
        keep_rows = options['keep_rows']
        dry_run = options['dry_run']

        auditoriums = Auditorium.objects.all().order_by('name')
        deleted_total = 0
        modified = []

        for auditorium in auditoriums:
            max_row = auditorium.seats.aggregate(m=Max('row_number'))['m']
            if max_row is None:
                modified.append(f"{auditorium.name}: no seats, skipped")
                continue

            to_delete = auditorium.seats.filter(row_number__gte=keep_rows)
            count = to_delete.count()

            if count == 0:
                modified.append(f"{auditorium.name}: already has ≤{keep_rows} rows, skipped")
                continue

            if dry_run:
                modified.append(
                    f"{auditorium.name}: would delete {count} seats (rows {keep_rows}-{max_row})"
                )
                continue

            with transaction.atomic():
                to_delete.delete()

            deleted_total += count
            modified.append(
                f"{auditorium.name}: deleted {count} seats (kept rows 0-{keep_rows - 1})"
            )

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run: no changes committed.'))

        if modified:
            for line in modified:
                self.stdout.write(self.style.SUCCESS(line))
        else:
            self.stdout.write(self.style.NOTICE('No auditoriums processed.'))

        self.stdout.write(self.style.SUCCESS(f'Total seats deleted: {deleted_total}'))
        self.stdout.write(self.style.SUCCESS('Row trimming complete.'))
