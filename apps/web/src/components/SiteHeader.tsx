import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, NavLink, useLocation } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { useScriptBag } from "@/scriptbag/useScriptBag";
import {
  Button,
  ClockIcon,
  CloseIcon,
  HeartIcon,
  LayersIcon,
  LinkButton,
  Logo,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
  cx,
} from "@/ui";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

const EASE = [0.22, 1, 0.36, 1] as const;

const PRIMARY_LINKS = [
  { to: "/apps", label: "Catalog" },
  { to: "/collections/public", label: "Collections" },
  { to: "/scripts", label: "Script" },
] as const;

const MOBILE_LINK_CLASS =
  "flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200";

function DesktopNavLink({
  to,
  label,
  reduced,
  count = 0,
}: {
  to: string;
  label: string;
  reduced: boolean;
  count?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "relative inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200 ease-out-quint",
          isActive ? "text-ember-ink" : "text-ink-muted hover:text-ink",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive &&
            (reduced ? (
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-ember-soft" />
            ) : (
              <motion.span
                layoutId="site-nav-pill"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-ember-soft"
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          <span className="relative">{label}</span>
          {count > 0 && (
            <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1.5 font-mono text-[0.625rem] leading-none text-white">
              {count}
              <span className="sr-only">apps in your script</span>
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function SiteHeader() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const bag = useScriptBag();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === location.pathname;
  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileNavId = useId();
  const reduced = useReducedMotion() === true;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      const node = headerRef.current;
      if (node === null) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      setMenuPath(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuPath(null);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const accountLinks = [
    { to: "/account", label: "Account", icon: <UserIcon size={16} /> },
    { to: "/favorites", label: "Favorites", icon: <HeartIcon size={16} /> },
    { to: "/collections", label: "My collections", icon: <LayersIcon size={16} /> },
    { to: "/scripts/history", label: "Script history", icon: <ClockIcon size={16} /> },
  ];
  if (isAdmin) accountLinks.push({ to: "/admin", label: "Admin", icon: <ShieldIcon size={16} /> });

  return (
    <header ref={headerRef} className="sticky top-0 z-50 pt-3">
      <div className="shell">
        <div
          className={cx(
            "flex h-14 items-center gap-2 rounded-full border px-3 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200 ease-out-quint",
            scrolled
              ? "border-line-strong bg-surface/92 shadow-lift"
              : "border-line bg-surface/80 shadow-soft",
          )}
        >
          <Link
            to="/"
            aria-label="FOSSLove home"
            className="inline-flex shrink-0 items-center rounded-full pl-1 pr-1.5"
          >
            <Logo size={28} />
          </Link>

          <nav
            aria-label="Main"
            className="hidden flex-1 items-center justify-center gap-1 md:flex"
          >
            {PRIMARY_LINKS.map((link) => (
              <DesktopNavLink
                key={link.to}
                to={link.to}
                label={link.label}
                reduced={reduced}
                count={link.to === "/scripts" ? bag.total : 0}
              />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />

            <div className="hidden items-center gap-2 md:flex">
              {isAuthenticated && user !== null ? (
                <UserMenu
                  user={user}
                  isAdmin={isAdmin}
                  onLogout={() => {
                    void logout();
                  }}
                />
              ) : (
                <>
                  <LinkButton to="/login" variant="ghost" size="sm">
                    Log in
                  </LinkButton>
                  <LinkButton to="/register" size="sm">
                    Sign up
                  </LinkButton>
                </>
              )}
            </div>

            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? mobileNavId : undefined}
              onClick={() => {
                setMenuPath(menuOpen ? null : location.pathname);
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink md:hidden"
            >
              {menuOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id={mobileNavId}
              initial={reduced ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mt-2 rounded-xl border border-line bg-surface p-3 shadow-lift md:hidden"
            >
              <nav aria-label="Main menu" className="flex flex-col gap-0.5">
                {PRIMARY_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => {
                      setMenuPath(null);
                    }}
                    className={({ isActive }) =>
                      cx(
                        MOBILE_LINK_CLASS,
                        isActive
                          ? "bg-ember-soft text-ember-ink"
                          : "text-ink-muted hover:bg-sunken hover:text-ink",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {isAuthenticated && (
                  <>
                    <span aria-hidden="true" className="mx-2 my-2 h-px bg-line" />
                    {accountLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => {
                          setMenuPath(null);
                        }}
                        className={({ isActive }) =>
                          cx(
                            MOBILE_LINK_CLASS,
                            isActive
                              ? "bg-ember-soft text-ember-ink"
                              : "text-ink-muted hover:bg-sunken hover:text-ink",
                          )
                        }
                      >
                        <span aria-hidden="true" className="text-ink-faint">
                          {link.icon}
                        </span>
                        {link.label}
                      </NavLink>
                    ))}
                  </>
                )}
              </nav>

              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                {isAuthenticated ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    block
                    icon={<LogOutIcon size={16} />}
                    onClick={() => {
                      void logout();
                    }}
                  >
                    Log out
                  </Button>
                ) : (
                  <>
                    <LinkButton to="/login" variant="secondary" size="sm" block>
                      Log in
                    </LinkButton>
                    <LinkButton to="/register" size="sm" block>
                      Sign up
                    </LinkButton>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
