import {
  useEffect,
  useState,
  type ComponentType,
  type CSSProperties,
  type SubmitEvent,
} from "react";
import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { PLATFORMS } from "@/api/types";
import { CategoryCard } from "@/components/CategoryCard";
import { PlatformFilter } from "@/components/PlatformFilter";
import { QueryBoundary } from "@/components/QueryBoundary";
import { StatBlock } from "@/components/StatBlock";
import { useApps, useCategories } from "@/features/catalog/hooks";
import type { Hue } from "@/lib/hues";
import {
  ArrowRightIcon,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  FolderIcon,
  GridIcon,
  LinkButton,
  MonitorIcon,
  Reveal,
  SearchInput,
  Section,
  SkeletonList,
  Stagger,
  StaggerItem,
  Terminal,
  TerminalIcon,
  TerminalLine,
  cx,
  type IconProps,
} from "@/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const CATEGORY_LIMIT = 12;

const PACKAGE_MANAGERS = [
  "winget",
  "msstore",
  "direct",
  "flatpak",
  "apt",
  "dnf",
  "pacman",
  "snap",
] as const;

const HERO_WASH: CSSProperties = {
  backgroundImage: [
    "radial-gradient(64rem 44rem at 6% -16%, color-mix(in oklab, var(--color-ember) var(--landing-wash), transparent), transparent 62%)",
    "radial-gradient(52rem 38rem at 96% -6%, color-mix(in oklab, var(--color-honey) var(--landing-wash), transparent), transparent 64%)",
    "radial-gradient(46rem 34rem at 42% 118%, color-mix(in oklab, var(--color-ember) calc(var(--landing-wash) / 2), transparent), transparent 68%)",
  ].join(", "),
};

const HERO_GRID: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-ink) 18%, transparent) 1px, transparent 0)",
  backgroundSize: "28px 28px",
  maskImage: "radial-gradient(62% 66% at 46% 18%, black 0%, transparent 74%)",
  WebkitMaskImage: "radial-gradient(62% 66% at 46% 18%, black 0%, transparent 74%)",
};

const CTA_WASH: CSSProperties = {
  backgroundImage: [
    "radial-gradient(36rem 24rem at 4% 0%, color-mix(in oklab, var(--color-ember) 46%, transparent), transparent 64%)",
    "radial-gradient(30rem 22rem at 98% 108%, color-mix(in oklab, var(--color-honey) 28%, transparent), transparent 62%)",
  ].join(", "),
};

type TerminalTone = "command" | "info" | "step" | "ok" | "done";

const TONE_COLOR: Record<TerminalTone, string> = {
  command: "var(--color-terminal-ink)",
  info: "color-mix(in oklab, var(--color-pine) 74%, var(--color-terminal-ink))",
  step: "color-mix(in oklab, var(--color-terminal-ink) 68%, transparent)",
  ok: "color-mix(in oklab, var(--color-moss) 78%, var(--color-terminal-ink))",
  done: "color-mix(in oklab, var(--color-honey) 80%, var(--color-terminal-ink))",
};

interface ScriptLine {
  text: string;
  prompt: string;
  tone: TerminalTone;
  delay: number;
}

const SCRIPT_LINES: readonly ScriptLine[] = [
  { text: "chmod +x install_apps.sh && ./install_apps.sh", prompt: "$", tone: "command", delay: 0 },
  {
    text: "Welcome to FOSSLove - installing your selected apps.",
    prompt: "",
    tone: "info",
    delay: 620,
  },
  { text: "Detected native package manager: apt", prompt: "", tone: "info", delay: 380 },
  { text: "[1/4] Installing Firefox...", prompt: "", tone: "step", delay: 480 },
  { text: "  OK  Firefox (11s)", prompt: "", tone: "ok", delay: 340 },
  { text: "[2/4] Installing VLC media player...", prompt: "", tone: "step", delay: 260 },
  { text: "  OK  VLC media player (7s)", prompt: "", tone: "ok", delay: 320 },
  { text: "[3/4] Installing Neovim...", prompt: "", tone: "step", delay: 260 },
  { text: "  OK  Neovim (4s)", prompt: "", tone: "ok", delay: 300 },
  { text: "[4/4] Installing Krita...", prompt: "", tone: "step", delay: 260 },
  { text: "  OK  Krita (19s)", prompt: "", tone: "ok", delay: 360 },
  {
    text: "Done in 41s. Installed: 4, Downloaded: 0, Failed: 0",
    prompt: "",
    tone: "done",
    delay: 520,
  },
];

const HUE_TILE: Record<Hue, string> = {
  ember: "bg-ember-soft text-ember-ink",
  honey: "bg-honey-soft text-honey-ink",
  moss: "bg-moss-soft text-moss-ink",
  pine: "bg-pine-soft text-pine-ink",
  sky: "bg-sky-soft text-sky-ink",
  cobalt: "bg-cobalt-soft text-cobalt-ink",
  plum: "bg-plum-soft text-plum-ink",
  berry: "bg-berry-soft text-berry-ink",
};

interface Step {
  title: string;
  body: string;
  hue: Hue;
  Icon: ComponentType<IconProps>;
}

const STEPS: readonly Step[] = [
  {
    title: "Pick your apps",
    body: "Browse the catalog by category and tick everything you want on a fresh machine.",
    hue: "ember",
    Icon: GridIcon,
  },
  {
    title: "Choose your platform",
    body: "Windows or Linux — FOSSLove resolves the right package for every app you picked.",
    hue: "sky",
    Icon: MonitorIcon,
  },
  {
    title: "Run one script",
    body: "Download the generated script, run it once, and the whole set installs unattended.",
    hue: "moss",
    Icon: TerminalIcon,
  },
];

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.05em] w-[0.5em] animate-caret rounded-[1px] bg-terminal-ink align-[-0.18em]"
    />
  );
}

function InstallTerminal() {
  const reduced = useReducedMotion();
  const total = SCRIPT_LINES.length;
  const [typed, setTyped] = useState(1);
  const visible = reduced === true ? total : typed;

  useEffect(() => {
    if (reduced === true || typed >= total) return;
    const next = SCRIPT_LINES[typed];
    const timer = window.setTimeout(() => {
      setTyped((current) => Math.min(current + 1, total));
    }, next?.delay ?? 320);
    return () => {
      window.clearTimeout(timer);
    };
  }, [reduced, typed, total]);

  const revealed = SCRIPT_LINES.slice(0, visible);
  const complete = visible >= total;

  return (
    <Terminal title="install_apps.sh" className="relative">
      <div aria-hidden="true" className="flex min-w-max flex-col gap-1">
        {revealed.map((line, index) => (
          <motion.div
            key={line.text}
            initial={reduced === true ? false : { opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
          >
            <TerminalLine prompt={line.prompt}>
              <span style={{ color: TONE_COLOR[line.tone] }}>{line.text}</span>
              {!complete && index === revealed.length - 1 ? <Caret /> : null}
            </TerminalLine>
          </motion.div>
        ))}
        {complete ? (
          <TerminalLine prompt="$">
            <Caret />
          </TerminalLine>
        ) : null}
      </div>
      <span className="sr-only">
        Sample run of a generated Linux script: it detects the package manager, then installs
        Firefox, VLC media player, Neovim and Krita.
      </span>
    </Terminal>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");

  const apps = useApps({ size: 1 });
  const categories = useCategories({ size: 100 });

  const appTotal = apps.data?.meta.total;
  const categoryTotal = categories.data?.meta.total;
  const shown = categories.data?.items.slice(0, CATEGORY_LIMIT) ?? [];

  const search = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const term = query.trim();
    if (term !== "") params.set("q", term);
    if (platform !== "") params.set("platform", platform);
    const qs = params.toString();
    void navigate(qs === "" ? "/apps" : `/apps?${qs}`);
  };

  return (
    <>
      <section className="grain under-header relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 [--landing-wash:17%] dark:[--landing-wash:26%]"
          style={HERO_WASH}
        />
        <div aria-hidden="true" className="absolute inset-0 z-0" style={HERO_GRID} />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-0 h-40 bg-linear-to-b from-transparent to-canvas"
        />

        <div className="shell relative z-10 pb-[clamp(3.5rem,8vw,6rem)] pt-[clamp(2.5rem,7vw,5rem)]">
          <Eyebrow>free &amp; open source · windows + linux</Eyebrow>

          <h1 className="mt-7 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-ink">
            Your whole setup,
            <br />
            <span className="text-ember">one script.</span>
          </h1>

          <div className="mt-[clamp(2.5rem,5vw,3.75rem)] grid gap-[clamp(2.5rem,5vw,3.5rem)] border-t border-line pt-[clamp(2rem,4vw,3rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
            <div className="flex min-w-0 flex-col gap-7">
              <p className="max-w-[48ch] text-base leading-relaxed text-ink-muted">
                Choose the free software you actually use and FOSSLove writes one install script
                that sets the whole machine up for you.
              </p>

              <form role="search" onSubmit={search} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label htmlFor="landing-search" className="sr-only">
                    Search apps
                  </label>
                  <SearchInput
                    id="landing-search"
                    name="q"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                    }}
                    onClear={() => {
                      setQuery("");
                    }}
                    placeholder="Search apps — firefox, vlc, neovim…"
                    containerClassName="flex-1"
                    className="h-14! text-base!"
                  />
                  <Button type="submit" size="lg" iconEnd={<ArrowRightIcon size={18} />}>
                    Search
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint"
                  >
                    platform
                  </span>
                  <PlatformFilter value={platform} onChange={setPlatform} includeAll />
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-3">
                <LinkButton to="/apps" size="lg" iconEnd={<ArrowRightIcon size={18} />}>
                  Browse the catalog
                </LinkButton>
                <LinkButton
                  to="/scripts"
                  size="lg"
                  variant="secondary"
                  icon={<TerminalIcon size={18} />}
                >
                  Build a script
                </LinkButton>
              </div>
            </div>

            <div className="relative min-w-0">
              <div
                aria-hidden="true"
                className="absolute -inset-5 rounded-2xl bg-ember/12 blur-2xl"
              />
              <InstallTerminal />
            </div>
          </div>
        </div>
      </section>

      <Section>
        <Reveal>
          <div className="grid grid-cols-2 gap-x-10 gap-y-12 border-y border-line py-[clamp(2.5rem,5vw,3.5rem)] lg:grid-cols-4">
            <StatBlock
              value={appTotal ?? "—"}
              label="apps in the catalog"
              hue="ember"
              pending={apps.isPending}
            />
            <StatBlock
              value={categoryTotal ?? "—"}
              label="categories"
              hue="pine"
              pending={categories.isPending}
            />
            <StatBlock value={PLATFORMS.length} label="platforms" hue="sky" />
            <StatBlock value={PACKAGE_MANAGERS.length} label="package managers" hue="honey" />
          </div>
          <p className="mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
            {PACKAGE_MANAGERS.join(" · ")}
          </p>
        </Reveal>
      </Section>

      <Section id="how-it-works">
        <Reveal>
          <Eyebrow hue="pine">how it works</Eyebrow>
          <h2 className="mt-5 max-w-[18ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.03em] text-ink">
            Three steps, then you are done.
          </h2>
        </Reveal>

        <Stagger className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const { Icon } = step;
            return (
              <StaggerItem key={step.title} className="h-full">
                <Card className="flex h-full flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "inline-flex size-12 shrink-0 items-center justify-center rounded-md",
                        HUE_TILE[step.hue],
                      )}
                    >
                      <Icon size={22} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-display text-[2.75rem] leading-none tracking-[-0.04em] text-line-strong"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <Section>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow hue="cobalt">browse by category</Eyebrow>
              <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.03em] text-ink">
                Everything, filed neatly.
              </h2>
            </div>
            <LinkButton
              to="/apps"
              variant="secondary"
              iconEnd={<ArrowRightIcon size={18} />}
              className="shrink-0"
            >
              See all
            </LinkButton>
          </div>
        </Reveal>

        <div className="mt-[clamp(2.5rem,5vw,3.5rem)]">
          <QueryBoundary
            isPending={categories.isPending}
            error={categories.error}
            isEmpty={shown.length === 0}
            skeleton={
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <SkeletonList count={6} />
              </div>
            }
            empty={
              <EmptyState
                icon={<FolderIcon size={24} />}
                title="No categories yet"
                description="The catalog has not been filled in yet. The app list will show whatever is already there."
                action={
                  <LinkButton to="/apps" variant="secondary">
                    Browse the catalog
                  </LinkButton>
                }
              />
            }
          >
            <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((category) => (
                <StaggerItem key={category.id} className="h-full">
                  <CategoryCard category={category} />
                </StaggerItem>
              ))}
            </Stagger>
          </QueryBoundary>
        </div>
      </Section>

      <Section>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl bg-terminal px-[clamp(1.75rem,5vw,4.5rem)] py-[clamp(3rem,7vw,5rem)] shadow-lift">
            <div aria-hidden="true" className="absolute inset-0 z-0" style={CTA_WASH} />
            <div className="relative z-10 flex flex-col items-start gap-9 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Eyebrow className="text-terminal-ink/60!">ready when you are</Eyebrow>
                <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-terminal-ink">
                  One script. Your whole setup.
                </h2>
              </div>
              <LinkButton
                to="/scripts"
                size="lg"
                iconEnd={<ArrowRightIcon size={18} />}
                className="shrink-0"
              >
                Build your script
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
