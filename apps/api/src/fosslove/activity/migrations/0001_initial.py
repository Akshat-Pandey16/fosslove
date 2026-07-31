import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=80, verbose_name='action')),
                ('status', models.CharField(choices=[('ok', 'OK'), ('failure', 'Failure')], default='ok', max_length=20, verbose_name='status')),
                ('target_type', models.CharField(blank=True, max_length=60, verbose_name='target type')),
                ('target_id', models.CharField(blank=True, max_length=80, verbose_name='target ID')),
                ('client_ip', models.CharField(blank=True, max_length=64, verbose_name='client IP')),
                ('request_id', models.CharField(blank=True, max_length=64, verbose_name='request ID')),
                ('user_agent', models.CharField(blank=True, max_length=400, verbose_name='user agent')),
                ('detail', models.JSONField(blank=True, null=True, verbose_name='detail')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activity_logs', to=settings.AUTH_USER_MODEL, verbose_name='user')),
            ],
            options={
                'verbose_name': 'activity log',
                'verbose_name_plural': 'activity logs',
                'ordering': ['-created_at', '-id'],
                'indexes': [models.Index(fields=['action', '-created_at'], name='ix_activity_action_created'), models.Index(fields=['user', '-created_at'], name='ix_activity_user_created'), models.Index(fields=['target_type', 'target_id'], name='ix_activity_target'), models.Index(fields=['status', '-created_at'], name='ix_activity_status_created')],
            },
        ),
    ]
