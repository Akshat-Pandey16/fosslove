import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { NavLink } from "react-router";
import { FolderIcon, GridIcon, PackageIcon, Section, SettingsIcon, cx } from "@/ui";

const TABS = [
  { to: "/admin", label: "Overview", end: true, icon: <GridIcon size={15} /> },
  { to: "/admin/apps", label: "Apps", end: false, icon: <PackageIcon size={15} /> },
  { to: "/admin/categories", label: "Categories", end: false, icon: <FolderIcon size={15} /> },
  { to: "/admin/settings", label: "Settings", end: false, icon: <SettingsIcon size={15} /> },
] as const;

export function AdminNav({ className }: { className?: string | undefined }) {
  const reduced = useReducedMotion();

  return (
    <nav
      aria-label="Admin sections"
      className={cx(
        "mb-10 flex w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1.5 shadow-soft",
        className,
      )}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cx(
              "relative inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ease-out-quint",
              isActive ? "text-ember-ink" : "text-ink-muted hover:text-ink",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive &&
                (reduced === true ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-ember-soft"
                  />
                ) : (
                  <motion.span
                    layoutId="admin-nav-pill"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-ember-soft"
                    transition={{ type: "spring", stiffness: 420, damping: 38 }}
                  />
                ))}
              <span className="relative inline-flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-sunken">
      <Section>
        <AdminNav />
        {children}
      </Section>
    </div>
  );
}
