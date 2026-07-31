import django.contrib.postgres.indexes
import django.db.models.deletion
import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0001_extensions"),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='name')),
                ('slug', models.SlugField(max_length=120, unique=True, verbose_name='slug')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('icon_url', models.URLField(blank=True, max_length=500, verbose_name='icon URL')),
                ('windows_app_count', models.PositiveIntegerField(default=0, editable=False)),
                ('linux_app_count', models.PositiveIntegerField(default=0, editable=False)),
            ],
            options={
                'verbose_name': 'category',
                'verbose_name_plural': 'categories',
                'ordering': ['name'],
                'constraints': [models.CheckConstraint(condition=models.Q(('windows_app_count__gte', 0)), name='ck_category_windows_count_nonneg'), models.CheckConstraint(condition=models.Q(('linux_app_count__gte', 0)), name='ck_category_linux_count_nonneg')],
            },
        ),
        migrations.CreateModel(
            name='App',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('platform', models.CharField(choices=[('windows', 'Windows'), ('linux', 'Linux')], max_length=10, verbose_name='platform')),
                ('name', models.CharField(max_length=200, verbose_name='name')),
                ('slug', models.SlugField(max_length=220, verbose_name='slug')),
                ('summary', models.CharField(blank=True, max_length=300, verbose_name='summary')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('homepage_url', models.URLField(blank=True, max_length=500, verbose_name='homepage URL')),
                ('license', models.CharField(blank=True, max_length=100, verbose_name='license')),
                ('is_active', models.BooleanField(default=True, verbose_name='active')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='apps', to='catalog.category', verbose_name='category')),
            ],
            options={
                'verbose_name': 'app',
                'verbose_name_plural': 'apps',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='PackageReference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('manager', models.CharField(choices=[('winget', 'winget'), ('msstore', 'Microsoft Store'), ('apt', 'APT'), ('dnf', 'DNF'), ('pacman', 'pacman'), ('flatpak', 'Flatpak'), ('snap', 'Snap'), ('direct', 'Direct download')], max_length=10, verbose_name='manager')),
                ('identifier', models.CharField(max_length=500, verbose_name='identifier')),
                ('install_args', models.CharField(blank=True, max_length=500, verbose_name='install args')),
                ('priority', models.PositiveIntegerField(default=100, verbose_name='priority')),
                ('extra', models.JSONField(blank=True, null=True, verbose_name='extra')),
                ('app', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='package_refs', to='catalog.app', verbose_name='app')),
            ],
            options={
                'verbose_name': 'package reference',
                'verbose_name_plural': 'package references',
                'ordering': ['priority', 'manager'],
            },
        ),
        migrations.AddIndex(
            model_name='app',
            index=models.Index(fields=['platform', 'name'], name='ix_app_platform_name'),
        ),
        migrations.AddIndex(
            model_name='app',
            index=models.Index(fields=['platform', 'category', 'name'], name='ix_app_platform_cat_name'),
        ),
        migrations.AddIndex(
            model_name='app',
            index=models.Index(condition=models.Q(('is_active', True)), fields=['platform', 'category', 'name'], name='ix_app_active_plat_cat_name'),
        ),
        migrations.AddIndex(
            model_name='app',
            index=django.contrib.postgres.indexes.GinIndex(django.contrib.postgres.indexes.OpClass(models.F('name'), name='gin_trgm_ops'), name='ix_app_name_trgm'),
        ),
        migrations.AddIndex(
            model_name='app',
            index=django.contrib.postgres.indexes.GinIndex(django.contrib.postgres.indexes.OpClass(models.F('summary'), name='gin_trgm_ops'), name='ix_app_summary_trgm'),
        ),
        migrations.AddConstraint(
            model_name='app',
            constraint=models.UniqueConstraint(fields=('category', 'platform', 'name'), name='uq_app_category_platform_name'),
        ),
        migrations.AddConstraint(
            model_name='app',
            constraint=models.UniqueConstraint(fields=('platform', 'slug'), name='uq_app_platform_slug'),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name='app',
            trigger=pgtrigger.compiler.Trigger(name='catalog_app_count_insert', sql=pgtrigger.compiler.UpsertTriggerSql(func="\n    IF NEW.is_active THEN\n        UPDATE catalog_category\n           SET windows_app_count = windows_app_count + (NEW.platform = 'windows')::int,\n               linux_app_count   = linux_app_count   + (NEW.platform = 'linux')::int\n         WHERE id = NEW.category_id;\n    END IF;\n    RETURN NEW;\n", hash='270607e745e0610bcb5873bd692c209d60e8e9b2', operation='INSERT', pgid='pgtrigger_catalog_app_count_insert_5d61d', table='catalog_app', when='AFTER')),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name='app',
            trigger=pgtrigger.compiler.Trigger(name='catalog_app_count_delete', sql=pgtrigger.compiler.UpsertTriggerSql(func="\n    IF OLD.is_active THEN\n        UPDATE catalog_category\n           SET windows_app_count = GREATEST(windows_app_count - (OLD.platform = 'windows')::int, 0),\n               linux_app_count   = GREATEST(linux_app_count   - (OLD.platform = 'linux')::int, 0)\n         WHERE id = OLD.category_id;\n    END IF;\n    RETURN OLD;\n", hash='3b257e2de41cd736779cd0422fcc777ef49aaaf7', operation='DELETE', pgid='pgtrigger_catalog_app_count_delete_d1888', table='catalog_app', when='AFTER')),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name='app',
            trigger=pgtrigger.compiler.Trigger(name='catalog_app_count_update', sql=pgtrigger.compiler.UpsertTriggerSql(condition='WHEN (OLD."is_active" IS DISTINCT FROM (NEW."is_active") OR OLD."category_id" IS DISTINCT FROM (NEW."category_id") OR OLD."platform" IS DISTINCT FROM (NEW."platform"))', func="\n    IF OLD.is_active THEN\n        UPDATE catalog_category\n           SET windows_app_count = GREATEST(windows_app_count - (OLD.platform = 'windows')::int, 0),\n               linux_app_count   = GREATEST(linux_app_count   - (OLD.platform = 'linux')::int, 0)\n         WHERE id = OLD.category_id;\n    END IF;\n    IF NEW.is_active THEN\n        UPDATE catalog_category\n           SET windows_app_count = windows_app_count + (NEW.platform = 'windows')::int,\n               linux_app_count   = linux_app_count   + (NEW.platform = 'linux')::int\n         WHERE id = NEW.category_id;\n    END IF;\n    RETURN NEW;\n", hash='bbdfe9d5272e8937d524f03e08901adae339af39', operation='UPDATE', pgid='pgtrigger_catalog_app_count_update_10c35', table='catalog_app', when='AFTER')),
        ),
        migrations.AddIndex(
            model_name='packagereference',
            index=models.Index(fields=['app', 'priority'], name='ix_package_app_priority'),
        ),
        migrations.AddConstraint(
            model_name='packagereference',
            constraint=models.UniqueConstraint(fields=('app', 'manager'), name='uq_package_app_manager'),
        ),
        migrations.AddConstraint(
            model_name='packagereference',
            constraint=models.CheckConstraint(condition=models.Q(('priority__gte', 0)), name='ck_package_priority_nonneg'),
        ),
    ]
