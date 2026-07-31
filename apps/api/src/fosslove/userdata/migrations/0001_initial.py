import django.contrib.postgres.fields
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalog', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Collection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=120, verbose_name='name')),
                ('slug', models.SlugField(max_length=140, verbose_name='slug')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('is_public', models.BooleanField(default=False, verbose_name='public')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='collections', to=settings.AUTH_USER_MODEL, verbose_name='owner')),
            ],
            options={
                'verbose_name': 'collection',
                'verbose_name_plural': 'collections',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CollectionApp',
            fields=[
                ('pk', models.CompositePrimaryKey('collection', 'app', blank=True, editable=False, primary_key=True, serialize=False)),
                ('position', models.PositiveIntegerField(default=0, verbose_name='position')),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('app', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='collection_links', to='catalog.app', verbose_name='app')),
                ('collection', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='userdata.collection', verbose_name='collection')),
            ],
            options={
                'verbose_name': 'collection app',
                'verbose_name_plural': 'collection apps',
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('pk', models.CompositePrimaryKey('user', 'app', blank=True, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('app', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='catalog.app', verbose_name='app')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to=settings.AUTH_USER_MODEL, verbose_name='user')),
            ],
            options={
                'verbose_name': 'favorite',
                'verbose_name_plural': 'favorites',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ScriptRun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.CharField(choices=[('windows', 'Windows'), ('linux', 'Linux')], max_length=10, verbose_name='platform')),
                ('app_ids', django.contrib.postgres.fields.ArrayField(base_field=models.BigIntegerField(), verbose_name='app IDs')),
                ('app_count', models.PositiveIntegerField(verbose_name='app count')),
                ('client_ip', models.CharField(blank=True, max_length=64, verbose_name='client IP')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='script_runs', to=settings.AUTH_USER_MODEL, verbose_name='user')),
            ],
            options={
                'verbose_name': 'script run',
                'verbose_name_plural': 'script runs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='collection',
            index=models.Index(condition=models.Q(('is_public', True)), fields=['-created_at'], name='ix_collection_public_created'),
        ),
        migrations.AddIndex(
            model_name='collection',
            index=models.Index(fields=['user', '-created_at'], name='ix_collection_user_created'),
        ),
        migrations.AddConstraint(
            model_name='collection',
            constraint=models.UniqueConstraint(fields=('user', 'slug'), name='uq_collection_user_slug'),
        ),
        migrations.AddConstraint(
            model_name='collection',
            constraint=models.UniqueConstraint(fields=('user', 'name'), name='uq_collection_user_name'),
        ),
        migrations.AddIndex(
            model_name='collectionapp',
            index=models.Index(fields=['app'], name='ix_collection_app_app'),
        ),
        migrations.AddIndex(
            model_name='collectionapp',
            index=models.Index(fields=['collection', 'position'], name='ix_collection_app_position'),
        ),
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['app'], name='ix_favorite_app'),
        ),
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['user', '-created_at'], name='ix_favorite_user_created'),
        ),
        migrations.AddIndex(
            model_name='scriptrun',
            index=models.Index(fields=['user', '-created_at'], name='ix_scriptrun_user_created'),
        ),
        migrations.AddIndex(
            model_name='scriptrun',
            index=models.Index(fields=['platform', '-created_at'], name='ix_scriptrun_plat_created'),
        ),
    ]
