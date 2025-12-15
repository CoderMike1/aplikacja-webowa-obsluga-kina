from datetime import date, datetime, time

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from screenings.models import Screening


class Command(BaseCommand):
    help = (
        "Remove screenings outside the allowed hours window (10:00–22:00) "
        "for the date range from today to Feb 28 (year auto-detected)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--start-date", type=str, default=None, help="YYYY-MM-DD; defaults to today")
        parser.add_argument("--end-year", type=int, default=None, help="Year for Feb 28 bound; defaults based on today")
        parser.add_argument("--dry-run", action="store_true", help="Preview without deleting")
        parser.add_argument("--open", dest="open_time", type=str, default="10:00", help="Opening time HH:MM")
        parser.add_argument("--close", dest="close_time", type=str, default="22:00", help="Closing time HH:MM (inclusive)")

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
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

        open_h, open_m = map(int, opts["open_time"].split(":"))
        close_h, close_m = map(int, opts["close_time"].split(":"))

        start_dt = timezone.make_aware(datetime.combine(today, time(0, 0)), tz)
        end_dt = timezone.make_aware(datetime.combine(end_date, time(23, 59)), tz)

        qs = Screening.objects.filter(start_time__gte=start_dt, start_time__lte=end_dt)

        to_remove_ids = []
        for sc in qs.iterator(chunk_size=1000):
            local = sc.start_time.astimezone(tz)
            hh = local.hour
            mm = local.minute
            # Valid window: from open_time inclusive to close_time inclusive
            is_before_open = (hh < open_h) or (hh == open_h and mm < open_m)
            is_after_close = (hh > close_h) or (hh == close_h and mm > close_m)
            if is_before_open or is_after_close:
                to_remove_ids.append(sc.id)

        if not to_remove_ids:
            self.stdout.write(self.style.SUCCESS("All screenings are within allowed hours."))
            return

        self.stdout.write(self.style.WARNING(f"Found {len(to_remove_ids)} screenings outside allowed hours."))

        if dry:
            sample = to_remove_ids[:10]
            self.stdout.write(self.style.WARNING(f"Dry-run: would remove IDs: {sample}"))
            return

        with transaction.atomic():
            deleted, _ = Screening.objects.filter(id__in=to_remove_ids).delete()
            self.stdout.write(self.style.SUCCESS(f"Removed {deleted} screenings outside allowed hours."))
