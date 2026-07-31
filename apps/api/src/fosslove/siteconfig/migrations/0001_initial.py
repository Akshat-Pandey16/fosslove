import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SiteConfiguration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('registration_enabled', models.BooleanField(blank=True, null=True)),
                ('email_enabled', models.BooleanField(blank=True, null=True)),
                ('rate_limit_enabled', models.BooleanField(blank=True, null=True)),
                ('rate_limit_default', models.CharField(blank=True, max_length=50, null=True, validators=[django.core.validators.RegexValidator(code='invalid_rate_limit', message="Rate limits must look like '200/minute'.", regex='^\\d+/(second|minute|hour|day)$')])),
                ('rate_limit_auth', models.CharField(blank=True, max_length=50, null=True, validators=[django.core.validators.RegexValidator(code='invalid_rate_limit', message="Rate limits must look like '200/minute'.", regex='^\\d+/(second|minute|hour|day)$')])),
                ('email_backend', models.CharField(blank=True, choices=[('console', 'Console'), ('smtp', 'SMTP')], max_length=10, null=True)),
                ('email_from', models.EmailField(blank=True, max_length=255, null=True)),
                ('smtp_host', models.CharField(blank=True, max_length=255, null=True)),
                ('smtp_port', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(65535)])),
                ('smtp_user', models.CharField(blank=True, max_length=255, null=True)),
                ('smtp_password', models.CharField(blank=True, max_length=500, null=True)),
                ('smtp_use_tls', models.BooleanField(blank=True, null=True)),
                ('project_name', models.CharField(blank=True, max_length=100, null=True)),
                ('frontend_base_url', models.URLField(blank=True, max_length=500, null=True, validators=[django.core.validators.URLValidator(schemes=['http', 'https'])])),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'site configuration',
                'constraints': [models.CheckConstraint(condition=models.Q(('smtp_port__isnull', True), models.Q(('smtp_port__gte', 1), ('smtp_port__lte', 65535)), _connector='OR'), name='ck_siteconfig_smtp_port_range'), models.CheckConstraint(condition=models.Q(('email_backend__isnull', True), ('email_backend__in', ['console', 'smtp']), _connector='OR'), name='ck_siteconfig_email_backend_valid')],
            },
        ),
    ]
