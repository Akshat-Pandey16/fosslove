import { Link } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { Eyebrow, HeartIcon, LinuxIcon, Logo, WindowsIcon } from "@/ui";
import { ThemeToggle } from "./ThemeToggle";

const LINK_CLASS =
  "w-fit text-sm text-ink-muted transition-colors duration-200 hover:text-ember";

export function SiteFooter() {
  const { isAdmin } = useAuth();

  return (
    <footer className="mt-auto border-t border-line">
      <div className="shell grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4">
          <Link to="/" aria-label="FOSSLove home" className="inline-flex rounded-full">
            <Logo size={30} />
          </Link>
          <p className="max-w-[36ch] text-sm leading-relaxed text-ink-muted">
            Free and open-source apps for Windows and Linux, picked once and installed in one go.
          </p>
          <p className="font-mono text-[0.6875rem] leading-relaxed tracking-[0.12em] text-ink-faint">
            # install your setup in one script
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col items-start gap-3">
          <Eyebrow hue="ember">explore</Eyebrow>
          <Link to="/apps" className={LINK_CLASS}>
            Catalog
          </Link>
          <Link to="/collections/public" className={LINK_CLASS}>
            Collections
          </Link>
          <Link to="/scripts" className={LINK_CLASS}>
            Script builder
          </Link>
          {isAdmin && (
            <Link to="/admin" className={LINK_CLASS}>
              Admin
            </Link>
          )}
        </nav>

        <div className="flex flex-col items-start gap-3">
          <Eyebrow hue="pine">appearance</Eyebrow>
          <ThemeToggle withLabel />
          <p className="mt-1 inline-flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <WindowsIcon size={13} />
              windows
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LinuxIcon size={13} />
              linux
            </span>
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-6">
          <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
            Free and open source.
            <HeartIcon size={14} className="text-ember" />
          </p>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-faint">
            fosslove
          </p>
        </div>
      </div>
    </footer>
  );
}
