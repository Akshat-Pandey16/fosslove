from __future__ import annotations

import pgtrigger

INCREMENT_BODY = """
    IF NEW.is_active THEN
        UPDATE catalog_category
           SET windows_app_count = windows_app_count + (NEW.platform = 'windows')::int,
               linux_app_count   = linux_app_count   + (NEW.platform = 'linux')::int
         WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
"""

DECREMENT_BODY = """
    IF OLD.is_active THEN
        UPDATE catalog_category
           SET windows_app_count = GREATEST(windows_app_count - (OLD.platform = 'windows')::int, 0),
               linux_app_count   = GREATEST(linux_app_count   - (OLD.platform = 'linux')::int, 0)
         WHERE id = OLD.category_id;
    END IF;
    RETURN OLD;
"""

MOVE_BODY = """
    IF OLD.is_active THEN
        UPDATE catalog_category
           SET windows_app_count = GREATEST(windows_app_count - (OLD.platform = 'windows')::int, 0),
               linux_app_count   = GREATEST(linux_app_count   - (OLD.platform = 'linux')::int, 0)
         WHERE id = OLD.category_id;
    END IF;
    IF NEW.is_active THEN
        UPDATE catalog_category
           SET windows_app_count = windows_app_count + (NEW.platform = 'windows')::int,
               linux_app_count   = linux_app_count   + (NEW.platform = 'linux')::int
         WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
"""

APP_COUNT_TRIGGERS = [
    pgtrigger.Trigger(
        name="catalog_app_count_insert",
        operation=pgtrigger.Insert,
        when=pgtrigger.After,
        func=INCREMENT_BODY,
    ),
    pgtrigger.Trigger(
        name="catalog_app_count_delete",
        operation=pgtrigger.Delete,
        when=pgtrigger.After,
        func=DECREMENT_BODY,
    ),
    pgtrigger.Trigger(
        name="catalog_app_count_update",
        operation=pgtrigger.Update,
        when=pgtrigger.After,
        condition=(
            pgtrigger.Q(old__is_active__df=pgtrigger.F("new__is_active"))
            | pgtrigger.Q(old__category__df=pgtrigger.F("new__category"))
            | pgtrigger.Q(old__platform__df=pgtrigger.F("new__platform"))
        ),
        func=MOVE_BODY,
    ),
]
