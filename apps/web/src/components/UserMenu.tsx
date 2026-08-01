import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, useLocation } from "react-router";
import type { User } from "@/api/types";
import { hueForEmail, initialsFor, type Hue } from "@/lib/hues";
import {
  ChevronDownIcon,
  ClockIcon,
  HeartIcon,
  LayersIcon,
  LogOutIcon,
  ShieldIcon,
  UserIcon,
  cx,
} from "@/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const HUE_AVATAR: Record<Hue, string> = {
  ember: "bg-ember-soft text-ember-ink",
  honey: "bg-honey-soft text-honey-ink",
  moss: "bg-moss-soft text-moss-ink",
  pine: "bg-pine-soft text-pine-ink",
  sky: "bg-sky-soft text-sky-ink",
  cobalt: "bg-cobalt-soft text-cobalt-ink",
  plum: "bg-plum-soft text-plum-ink",
  berry: "bg-berry-soft text-berry-ink",
};

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left text-sm transition-colors duration-200";

interface MenuLink {
  to: string;
  label: string;
  icon: ReactNode;
}

export function UserMenu({
  user,
  isAdmin,
  onLogout,
}: {
  user: User;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const location = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === location.pathname;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  const menuId = useId();
  const reduced = useReducedMotion();

  const setOpen = (value: boolean) => {
    setOpenPath(value ? location.pathname : null);
  };

  const links: MenuLink[] = [
    { to: "/account", label: "Account", icon: <UserIcon size={16} /> },
    { to: "/favorites", label: "Favorites", icon: <HeartIcon size={16} /> },
    { to: "/collections", label: "My collections", icon: <LayersIcon size={16} /> },
    { to: "/scripts/history", label: "Script history", icon: <ClockIcon size={16} /> },
  ];
  if (isAdmin) links.push({ to: "/admin", label: "Admin", icon: <ShieldIcon size={16} /> });

  const total = links.length + 1;
  const hue = hueForEmail(user.email);
  const initials = initialsFor(user.full_name.trim() === "" ? user.email : user.full_name);
  const displayName = user.full_name.trim() === "" ? user.email : user.full_name;

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      const node = containerRef.current;
      if (node === null) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      setOpenPath(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemsRef.current[0]?.focus();
  }, [open]);

  const focusAt = (index: number) => {
    itemsRef.current[((index % total) + total) % total]?.focus();
  };

  const activeIndex = () =>
    itemsRef.current.findIndex((node) => node !== null && node === document.activeElement);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusAt(activeIndex() + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusAt(activeIndex() - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(total - 1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setOpen(!open);
        }}
        onKeyDown={onTriggerKeyDown}
        className={cx(
          "inline-flex h-10 shrink-0 items-center gap-1 rounded-full border py-1 pl-1 pr-1.5 transition-colors duration-200 ease-out-quint",
          open ? "border-line-strong bg-sunken" : "border-line bg-surface hover:border-line-strong",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "inline-flex size-8 items-center justify-center rounded-full font-display text-[0.8125rem] font-semibold tracking-[-0.02em]",
            HUE_AVATAR[hue],
          )}
        >
          {initials}
        </span>
        <ChevronDownIcon
          size={16}
          className={cx(
            "text-ink-faint transition-transform duration-200 ease-out-quint",
            open && "rotate-180",
          )}
        />
        <span className="sr-only">Account menu for {user.email}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            onKeyDown={onPanelKeyDown}
            initial={reduced === true ? false : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced === true ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-64 origin-top-right rounded-xl border border-line bg-surface p-2 shadow-lift"
          >
            <div className="px-3 pb-2 pt-1.5">
              <p className="truncate font-display text-sm font-semibold leading-tight text-ink">
                {displayName}
              </p>
              <p className="truncate font-mono text-[0.625rem] tracking-[0.02em] text-ink-faint">
                {user.email}
              </p>
            </div>

            <div aria-hidden="true" className="mx-1 my-1 h-px bg-line" />

            <div id={menuId} role="menu" aria-label="Account" className="flex flex-col gap-0.5">
              {links.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  role="menuitem"
                  tabIndex={-1}
                  ref={(node) => {
                    itemsRef.current[index] = node;
                  }}
                  onClick={() => {
                    setOpenPath(null);
                  }}
                  className={cx(ITEM_CLASS, "text-ink-muted hover:bg-sunken hover:text-ink")}
                >
                  <span aria-hidden="true" className="text-ink-faint">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                ref={(node) => {
                  itemsRef.current[links.length] = node;
                }}
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className={cx(ITEM_CLASS, "text-ember-ink hover:bg-ember-soft")}
              >
                <span aria-hidden="true">
                  <LogOutIcon size={16} />
                </span>
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
