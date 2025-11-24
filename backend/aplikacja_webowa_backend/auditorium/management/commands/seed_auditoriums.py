from django.core.management.base import BaseCommand, CommandError
from auditorium.models import Auditorium

DEFAULT_AUDITORIUM_NAMES = [
    "Szafirowa",
    "Rubinowa",
    "Srebrna",
    "Złota",
    "Platynowa",
    "Kryształowa",
    "Kręcona",
]

class Command(BaseCommand):
    help = "Seed the database with predefined auditorium (sala) records if they do not already exist."

    def add_arguments(self, parser):
        parser.add_argument(
            "--names",
            nargs="*",
            default=None,
            help="Optional list of auditorium names to seed. If omitted, a default curated list is used.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show which auditoriums would be created without writing to the database.",
        )

    def handle(self, *args, **options):
        names = options["names"] or DEFAULT_AUDITORIUM_NAMES
        dry_run = options["dry_run"]

        created = []
        skipped = []

        for name in names:
            if Auditorium.objects.filter(name=name).exists():
                skipped.append(name)
                continue
            if dry_run:
                created.append(name)
            else:
                Auditorium.objects.create(name=name)
                created.append(name)

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: no changes committed."))

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created: {', '.join(created)}"))
        else:
            self.stdout.write(self.style.NOTICE("No new auditoriums created."))

        if skipped:
            self.stdout.write(self.style.HTTP_INFO(f"Skipped existing: {', '.join(skipped)}"))

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
