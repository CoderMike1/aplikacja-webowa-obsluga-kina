import random
from datetime import date, datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from screenings.models import Screening, ProjectionType


PT_NAMES = [
    "Dubbing 4DX",
    "Dubbing IMAX",
    "Dubbing 3D",
    "Dubbing 2D",
    "Napisy IMAX",
    "Napisy 4DX",
    "Napisy 3D",
    "Napisy 2D",
]


class Command(BaseCommand):
    help = (
        "Randomly assign one of 8 projection types to screenings in a date range. "
        "Ensures all 8 types exist; supports dry-run and 'only-empty' to avoid overwriting."
    )

    def add_arguments(self, parser):
        parser.add_argument("--start-date", type=str, default=None, help="YYYY-MM-DD; defaults to today")
        parser.add_argument("--end-year", type=int, default=None, help="Year for Feb 28 bound; defaults based on today")
        parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
        parser.add_argument("--only-empty", action="store_true", help="Only assign where projection_type is NULL")

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
        only_empty = opts["only_empty"]
        tz = timezone.get_current_timezone()

        # Determine date range
        today = timezone.localdate() if not opts.get("start_date") else date.fromisoformat(opts["start_date"])
        if opts.get("end_year") is not None:
            end_year = opts["end_year"]
        else:
            feb28_this_year = date(today.year, 2, 28)
            end_year = today.year if today <= feb28_this_year else today.year + 1
        end_date = date(end_year, 2, 28)
        if today > end_date:
            self.stderr.write(self.style.ERROR(f"Start date {today} is after end date {end_date}"))
            return

        # Ensure all projection types exist
        pt_map = {}
        for name in PT_NAMES:
            pt, _ = ProjectionType.objects.get_or_create(name=name)
            pt_map[name] = pt
        pt_values = list(pt_map.values())

        start_dt = timezone.make_aware(datetime.combine(today, time(0, 0)), tz)
        end_dt = timezone.make_aware(datetime.combine(end_date, time(23, 59)), tz)

        qs = Screening.objects.filter(start_time__gte=start_dt, start_time__lte=end_dt)
        if only_empty:
            qs = qs.filter(projection_type__isnull=True)

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No screenings found to update."))
            return

        self.stdout.write(self.style.SUCCESS(f"Assigning projection types to {total} screenings."))

        updates = []
        for sc in qs.iterator(chunk_size=1000):
            sc.projection_type = random.choice(pt_values)
            updates.append(sc)

        if dry:
            # Show a small sample of planned changes
            sample = updates[:10]
            for s in sample:
                self.stdout.write(f"{s.start_time} | {s.auditorium_id} -> {s.projection_type.name}")
            self.stdout.write(self.style.WARNING("Dry-run: no changes saved."))
            return

        with transaction.atomic():
            Screening.objects.bulk_update(updates, ["projection_type"])  # type: ignore[arg-type]

        self.stdout.write(self.style.SUCCESS("Projection types assigned successfully."))
