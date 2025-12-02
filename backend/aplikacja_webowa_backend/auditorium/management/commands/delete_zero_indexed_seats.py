from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from auditorium.models import Auditorium, Seat


class Command(BaseCommand):
    help = "Delete seats where row_number=0 or seat_number=0 (cleanup zero-indexed seats)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would be deleted without modifying the database.'
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

        total_deleted = 0
        modified = []
        skipped = []

        for aud in auditoriums:
            qs = Seat.objects.filter(auditorium=aud).filter(Q(row_number=0) | Q(seat_number=0))
            count = qs.count()
            if count == 0:
                skipped.append(f"{aud.name}: nothing to delete")
                continue

            if dry_run:
                modified.append(f"{aud.name}: would delete {count} zero-indexed seats")
                continue

            with transaction.atomic():
                qs.delete()
            total_deleted += count
            modified.append(f"{aud.name}: deleted {count} zero-indexed seats")

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run: no changes committed.'))

        for line in modified:
            self.stdout.write(self.style.SUCCESS(line))

        if skipped:
            self.stdout.write(self.style.HTTP_INFO('Skipped: ' + ', '.join(skipped)))

        self.stdout.write(self.style.SUCCESS(f'Total seats deleted: {total_deleted}'))
        self.stdout.write(self.style.SUCCESS('Cleanup complete.'))
