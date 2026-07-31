import django.db.models.functions.text
import fosslove.accounts.managers
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(max_length=320, unique=True, verbose_name='email address')),
                ('full_name', models.CharField(blank=True, max_length=200, verbose_name='full name')),
                ('is_active', models.BooleanField(default=True, verbose_name='active')),
                ('is_staff', models.BooleanField(default=False, verbose_name='staff status')),
                ('is_verified', models.BooleanField(default=False, verbose_name='email verified')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='date joined')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'indexes': [models.Index(fields=['is_active', 'created_at'], name='ix_users_active_created')],
                'constraints': [models.UniqueConstraint(django.db.models.functions.text.Lower('email'), name='uq_users_email_ci')],
            },
            managers=[
                ('objects', fosslove.accounts.managers.UserManager()),
            ],
        )
    ]
