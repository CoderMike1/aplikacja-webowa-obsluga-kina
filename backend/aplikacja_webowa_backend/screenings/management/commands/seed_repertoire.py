import random
from datetime import date, datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from movies.models import Movie
from auditorium.models import Auditorium
from screenings.models import Screening, ProjectionType


def round_up_to_10min(dt: datetime) -> datetime:
    minute = ((dt.minute + 9) // 10) * 10
    if minute >= 60:
        dt = dt.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    else:
        dt = dt.replace(minute=minute, second=0, microsecond=0)
    return dt


class Command(BaseCommand):
    help = (
        "Seed screenings from today to Feb 28: 5–8 films/day, use all 10 auditoriums, "
        "per-auditorium 3–5 different films/day, realistic showtimes with breaks, no overlaps."
    )

    def add_arguments(self, parser):
        parser.add_argument("--start-date", type=str, default=None, help="YYYY-MM-DD; defaults to today")
        parser.add_argument("--end-year", type=int, default=None, help="Year for Feb 28 bound; defaults based on today")
        parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
        parser.add_argument("--reset", action="store_true", help="Delete existing screenings in range before seeding")
        parser.add_argument("--open", dest="open_time", type=str, default="10:00", help="Opening time HH:MM")
        parser.add_argument("--close", dest="close_time", type=str, default="23:30", help="Closing time HH:MM")
        parser.add_argument("--min-daily", type=int, default=5, help="Min distinct films per day")
        parser.add_argument("--max-daily", type=int, default=8, help="Max distinct films per day")
        parser.add_argument("--min-room", type=int, default=3, help="Min distinct films per room/day")
        parser.add_argument("--max-room", type=int, default=5, help="Max distinct films per room/day")
        parser.add_argument("--break-min", type=int, default=15, help="Min cleaning break minutes")
        parser.add_argument("--break-max", type=int, default=25, help="Max cleaning break minutes")

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
        reset = opts["reset"]
        min_daily = opts["min_daily"]
        max_daily = opts["max_daily"]
        min_room = opts["min_room"]
        max_room = opts["max_room"]
        br_min = opts["break_min"]
        br_max = opts["break_max"]

        if min_daily > max_daily or min_room > max_room:
            self.stderr.write(self.style.ERROR("Min cannot exceed Max for daily or room film counts."))
            return

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

        # Ensure 8 projection types exist, use randomly per screening
        pt_names = [
            "Dubbing 4DX",
            "Dubbing IMAX",
            "Dubbing 3D",
            "Dubbing 2D",
            "Napisy IMAX",
            "Napisy 4DX",
            "Napisy 3D",
            "Napisy 2D",
        ]
        pt_values = [ProjectionType.objects.get_or_create(name=n)[0] for n in pt_names]

        auditoriums = list(Auditorium.objects.order_by("name"))
        if len(auditoriums) == 0:
            self.stderr.write(self.style.ERROR("No auditoriums found."))
            return
        self.stdout.write(self.style.SUCCESS(f"Found {len(auditoriums)} auditoriums."))

        # Optional reset existing screenings in range
        if reset and not dry:
            with transaction.atomic():
                start_dt = timezone.make_aware(datetime.combine(today, time(0, 0)), tz)
                end_dt = timezone.make_aware(datetime.combine(end_date, time(23, 59)), tz)
                deleted, _ = Screening.objects.filter(start_time__gte=start_dt, start_time__lte=end_dt).delete()
                self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing screenings in range."))

        total_created = 0
        day = today
        while day <= end_date:
            # Eligible movies: released for cinema by this day
            eligible = list(
                Movie.objects.filter(cinema_release_date__lte=day).order_by("-cinema_release_date", "title")
            )
            if not eligible:
                self.stdout.write(self.style.WARNING(f"{day}: no eligible movies; skipping."))
                day += timedelta(days=1)
                continue

            daily_target = random.randint(min_daily, max_daily)
            daily_movies = eligible if len(eligible) <= daily_target else random.sample(eligible, daily_target)
            # Guarantee distinctness set size within [min_daily, max_daily] subject to availability
            if len(daily_movies) < min_daily and len(eligible) > len(daily_movies):
                need = min(min_daily - len(daily_movies), len(eligible) - len(daily_movies))
                pool = [m for m in eligible if m not in daily_movies]
                daily_movies.extend(random.sample(pool, need))

            # Per-room selection: ensure every daily movie appears in at least one room
            room_movie_sets = [[] for _ in auditoriums]
            # First pass: assign each daily movie to a room round-robin
            for idx, mv in enumerate(daily_movies):
                room_movie_sets[idx % len(auditoriums)].append(mv)

            # Fill each room to 3–5 titles using the daily set
            for i in range(len(auditoriums)):
                k = random.randint(min_room, max_room)
                base = room_movie_sets[i]
                needed = max(0, min(k, len(daily_movies)) - len(base))
                if needed > 0:
                    pool = [m for m in daily_movies if m not in base]
                    extra = random.sample(pool, needed) if len(pool) >= needed else pool
                    base.extend(extra)
                room_movie_sets[i] = base

            # Schedule day per room
            day_created = 0
            for room, titles in zip(auditoriums, room_movie_sets):
                if not titles:
                    continue

                # Start from opening time
                curr = timezone.make_aware(datetime.combine(day, time(open_h, open_m)), tz)
                close_dt = timezone.make_aware(datetime.combine(day, time(close_h, close_m)), tz)
                titles_cycle = titles.copy()
                random.shuffle(titles_cycle)
                idx = 0

                # Publish earlier than any screening that day to satisfy constraint
                published_at = timezone.make_aware(datetime.combine(day, time(0, 0)), tz) - timedelta(hours=1)

                while curr < close_dt:
                    mv = titles_cycle[idx % len(titles_cycle)]
                    idx += 1
                    start_dt = round_up_to_10min(curr)
                    if start_dt >= close_dt:
                        break

                    # Create screening
                    if not dry:
                        try:
                            Screening.objects.create(
                                movie=mv,
                                start_time=start_dt,
                                auditorium=room,
                                projection_type=random.choice(pt_values),
                                published_at=published_at,
                            )
                            day_created += 1
                            total_created += 1
                        except Exception as e:
                            # Skip collisions or validation failures gracefully
                            self.stdout.write(self.style.WARNING(f"Skip {room.name} {start_dt}: {e}"))
                    else:
                        day_created += 1
                        total_created += 1

                    # Advance time: movie duration + random cleaning break
                    dur_min = int(mv.duration_minutes) if mv.duration_minutes else 120
                    break_min = random.randint(br_min, br_max)
                    curr = start_dt + timedelta(minutes=dur_min + break_min)

            self.stdout.write(self.style.SUCCESS(f"{day}: created ~{day_created} screenings across {len(auditoriums)} rooms."))
            day += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(f"Done. Total screenings created (or planned): {total_created}"))
