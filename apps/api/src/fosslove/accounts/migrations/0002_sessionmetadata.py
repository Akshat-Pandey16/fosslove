import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("token_blacklist", "0013_alter_blacklistedtoken_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name='SessionMetadata',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_agent', models.CharField(blank=True, max_length=400)),
                ('client_ip', models.CharField(blank=True, max_length=64)),
                ('last_used_at', models.DateTimeField(blank=True, null=True)),
                ('token', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='metadata', to='token_blacklist.outstandingtoken')),
            ],
            options={
                'verbose_name': 'session metadata',
                'verbose_name_plural': 'session metadata',
                'indexes': [models.Index(fields=['last_used_at'], name='ix_session_meta_last_used')],
            },
        )
    ]
