import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from movies.models import Movie


class Command(BaseCommand):
    help = (
        "Select 30 movies with the farthest cinema_release_date and move "
        "their cinema_release_date randomly between today and Feb 28. "
        "Ensures the model constraint: release_date <= cinema_release_date."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--end-year",
            type=int,
            default=None,
            help="Override end year for the Feb 28 boundary (defaults to current year or next year if today > Feb 28).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=30,
            help="How many movies to update (default: 30)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only show planned changes without saving",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        limit = options.get("limit", 30)
        end_year_override = options.get("end_year")

        today = timezone.localdate()

        # Determine end boundary: Feb 28 of either this year or next year depending on today's date
        if end_year_override is not None:
            end_year = end_year_override
        else:
            feb28_this_year = date(today.year, 2, 28)
            end_year = today.year if today <= feb28_this_year else today.year + 1

        end_date = date(end_year, 2, 28)

        if today > end_date:
            self.stderr.write(
                self.style.ERROR(
                    f"Today's date {today} is after end date {end_date}. Aborting."
                )
            )
            return

        # Range size in days
        span_days = (end_date - today).days
        if span_days <= 0:
            self.stderr.write(self.style.ERROR("Date span is non-positive. Aborting."))
            return

        # Select candidates: have a cinema_release_date and order by farthest (largest) date first
        qs = (
            Movie.objects.exclude(cinema_release_date__isnull=True)
            .order_by("-cinema_release_date")
        )

        count = qs.count()
        if count == 0:
            self.stdout.write(self.style.WARNING("No movies found with a cinema_release_date."))
            return

        selected = list(qs[:limit])

        self.stdout.write(
            self.style.SUCCESS(
                f"Preparing to update {len(selected)} movies. Date range: {today} → {end_date} (span {span_days} days)."
            )
        )

        planned_changes = []
        for m in selected:
            # Pick a random day offset within [0, span_days]
            offset = random.randint(0, span_days)
            new_date = today + timedelta(days=offset)

            # Respect constraint: release_date <= cinema_release_date
            new_release_date = m.release_date
            if m.release_date and m.release_date > new_date:
                new_release_date = new_date

            planned_changes.append(
                {
                    "id": m.id,
                    "title": m.title,
                    "old_release_date": m.release_date,
                    "old_cinema_release_date": m.cinema_release_date,
                    "new_release_date": new_release_date,
                    "new_cinema_release_date": new_date,
                }
            )

        # Display planned changes
        for ch in planned_changes:
            self.stdout.write(
                f"[{ch['id']}] {ch['title']}: "
                f"cinema {ch['old_cinema_release_date']} → {ch['new_cinema_release_date']}; "
                f"release {ch['old_release_date']} → {ch['new_release_date']}"
            )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run: no changes saved."))
            return

        # Persist changes atomically
        with transaction.atomic():
            for ch in planned_changes:
                Movie.objects.filter(id=ch["id"]).update(
                    cinema_release_date=ch["new_cinema_release_date"],
                    release_date=ch["new_release_date"],
                )

        self.stdout.write(self.style.SUCCESS("Updates applied successfully."))