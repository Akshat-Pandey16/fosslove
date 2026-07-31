from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser

from fosslove.accounts.models import User


class Command(BaseCommand):
    help = "Create the bootstrap admin user from settings or arguments if it does not exist."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--email", default=settings.FIRST_ADMIN_EMAIL)
        parser.add_argument("--password", default=settings.FIRST_ADMIN_PASSWORD)

    def handle(self, *args: Any, **options: Any) -> None:
        email = (options["email"] or "").strip().lower()
        password = options["password"] or ""
        if not email or not password:
            self.stdout.write(
                self.style.WARNING("No admin email/password provided; nothing to do.")
            )
            return
        if User.objects.filter(email__iexact=email).exists():
            self.stdout.write(self.style.NOTICE(f"Admin {email} already exists."))
            return
        User.objects.create_superuser(email=email, password=password, full_name="Administrator")
        self.stdout.write(self.style.SUCCESS(f"Created admin {email}."))
