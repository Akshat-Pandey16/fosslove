from __future__ import annotations

from django.contrib.postgres.operations import BtreeGinExtension, TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):
    initial = True

    dependencies: list[tuple[str, str]] = []

    operations = [
        TrigramExtension(),
        BtreeGinExtension(),
    ]
