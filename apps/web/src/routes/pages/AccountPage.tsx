import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { QueryBoundary } from "@/components/QueryBoundary";
import {
  useChangePassword,
  useDataExport,
  useDeleteAccount,
  useRequestEmailChange,
  useRevokeSession,
  useSessions,
  useUpdateProfile,
} from "@/features/account/hooks";
import { messageFor } from "@/lib/errors";
import { formatDate, relativeTime } from "@/lib/format";
import { formString } from "@/lib/form";
import { hueForEmail, initialsFor, type Hue } from "@/lib/hues";
import {
  Alert,
  AlertIcon,
  Badge,
  Button,
  Card,
  CheckIcon,
  DownloadIcon,
  EmptyState,
  Eyebrow,
  Field,
  Input,
  KeyIcon,
  MailIcon,
  MonitorIcon,
  PageHeader,
  RefreshIcon,
  Section,
  ShieldIcon,
  Skeleton,
  TrashIcon,
  UserIcon,
  cx,
} from "@/ui";

const SECTIONS = [
  { id: "profile", label: "Profile", hue: "ember" },
  { id: "password", label: "Password", hue: "cobalt" },
  { id: "email", label: "Email", hue: "sky" },
  { id: "sessions", label: "Sessions", hue: "pine" },
  { id: "data", label: "Your data", hue: "honey" },
  { id: "danger", label: "Danger zone", hue: "berry" },
] as const satisfies readonly { id: string; label: string; hue: Hue }[];

const SECTION_IDS: readonly string[] = SECTIONS.map((section) => section.id);

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

const HUE_DOT: Record<Hue, string> = {
  ember: "bg-ember",
  honey: "bg-honey",
  moss: "bg-moss",
  pine: "bg-pine",
  sky: "bg-sky",
  cobalt: "bg-cobalt",
  plum: "bg-plum",
  berry: "bg-berry",
};

const META_LINE = "font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint";

const DANGER_CARD = "border-berry! bg-berry-soft/40!";

function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return undefined;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = ids.find((id) => visible.has(id));
        if (current !== undefined) setActive(current);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return active;
}

function AccountRail({ active }: { active: string }) {
  const reduced = useReducedMotion();

  return (
    <nav aria-label="Account sections" className="flex flex-col gap-4">
      <div className="hidden lg:block">
        <Eyebrow hue="ember">sections</Eyebrow>
      </div>
      <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {SECTIONS.map((section) => {
          const isActive = section.id === active;

          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cx(
                  "relative flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm transition-colors duration-200 ease-out-quint lg:w-full",
                  isActive ? "text-ember-ink" : "text-ink-muted hover:bg-sunken hover:text-ink",
                )}
              >
                {isActive &&
                  (reduced === true ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-ember-soft"
                    />
                  ) : (
                    <motion.span
                      layoutId="account-rail-active"
                      aria-hidden="true"
                      transition={{ type: "spring", stiffness: 420, damping: 40 }}
                      className="absolute inset-0 rounded-full bg-ember-soft"
                    />
                  ))}
                <span
                  aria-hidden="true"
                  className={cx("relative size-1.5 shrink-0 rounded-full", HUE_DOT[section.hue])}
                />
                <span className="relative whitespace-nowrap">{section.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AccountSection({
  id,
  hue,
  icon,
  title,
  description,
  danger = false,
  children,
}: {
  id: string;
  hue: Hue;
  icon: ReactNode;
  title: string;
  description: string;
  danger?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <Card
        padded={false}
        className={cx("flex flex-col gap-7 p-6 sm:p-8", danger && DANGER_CARD)}
      >
        <header className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={cx(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-md",
              HUE_TILE[hue],
            )}
          >
            {icon}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h2
              id={`${id}-title`}
              className="font-display text-xl leading-tight tracking-[-0.02em] text-ink"
            >
              {title}
            </h2>
            <p className="max-w-[58ch] text-sm leading-relaxed text-ink-muted">{description}</p>
          </div>
        </header>
        {children}
      </Card>
    </section>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const update = useUpdateProfile();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({ full_name: formString(form, "full_name") });
  };

  const email = user?.email ?? "";
  const fullName = user?.full_name ?? "";
  const hue = hueForEmail(email);
  const initials = initialsFor(fullName.trim() === "" ? email : fullName);

  return (
    <AccountSection
      id="profile"
      hue="ember"
      icon={<UserIcon size={20} />}
      title="Profile"
      description="How you appear across FOSSLove."
    >
      <div className="flex flex-wrap items-center gap-5 rounded-lg border border-line bg-sunken/60 p-5">
        <span
          aria-hidden="true"
          className={cx(
            "inline-flex size-16 shrink-0 items-center justify-center rounded-md font-display text-xl font-semibold tracking-[-0.02em]",
            HUE_TILE[hue],
          )}
        >
          {initials}
        </span>
        {user === null ? null : (
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="truncate font-mono text-sm text-ink">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge hue={user.role === "admin" ? "cobalt" : undefined}>{user.role}</Badge>
              {user.is_verified ? (
                <Badge hue="moss" icon={<CheckIcon size={12} />}>
                  verified
                </Badge>
              ) : (
                <Badge hue="honey" icon={<AlertIcon size={12} />}>
                  unverified
                </Badge>
              )}
              <span className={META_LINE}>joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Display name" htmlFor="full_name" hint="Shown on your public collections.">
          <Input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            defaultValue={user?.full_name ?? ""}
          />
        </Field>
        {update.isError && <Alert tone="danger">{messageFor(update.error)}</Alert>}
        {update.isSuccess && <Alert tone="success">Profile updated.</Alert>}
        <div className="flex justify-end">
          <Button type="submit" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </AccountSection>
  );
}

function ChangePasswordSection() {
  const change = useChangePassword();
  const navigate = useNavigate();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    change.mutate(
      {
        current_password: formString(form, "current_password"),
        new_password: formString(form, "new_password"),
      },
      {
        onSuccess: (data) => {
          void navigate("/login", { replace: true, state: { notice: data.message } });
        },
      },
    );
  };

  return (
    <AccountSection
      id="password"
      hue="cobalt"
      icon={<KeyIcon size={20} />}
      title="Change password"
      description="Changing your password signs you out everywhere, so you will need to log in again."
    >
      {change.isSuccess ? (
        <Alert tone="success">{change.data.message}</Alert>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Current password" htmlFor="current_password" required>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="New password" htmlFor="new_password" required>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          </div>
          {change.isError && <Alert tone="danger">{messageFor(change.error)}</Alert>}
          <div className="flex justify-end">
            <Button type="submit" loading={change.isPending}>
              Change password
            </Button>
          </div>
        </form>
      )}
    </AccountSection>
  );
}

function ChangeEmailSection() {
  const request = useRequestEmailChange();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    request.mutate({
      new_email: formString(form, "new_email"),
      current_password: formString(form, "email_current_password"),
    });
  };

  return (
    <AccountSection
      id="email"
      hue="sky"
      icon={<MailIcon size={20} />}
      title="Change email address"
      description="We send a confirmation link to the new address before anything changes."
    >
      {request.isSuccess ? (
        <Alert tone="success">{request.data.message}</Alert>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="New email" htmlFor="new_email" required>
              <Input
                id="new_email"
                name="new_email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Confirm your password" htmlFor="email_current_password" required>
              <Input
                id="email_current_password"
                name="email_current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
          </div>
          {request.isError && <Alert tone="danger">{messageFor(request.error)}</Alert>}
          <div className="flex justify-end">
            <Button type="submit" loading={request.isPending}>
              Change email
            </Button>
          </div>
        </form>
      )}
    </AccountSection>
  );
}

function SessionsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-line bg-sunken/40 p-4"
        >
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function SessionsSection() {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const rows = sessions.data ?? [];

  return (
    <AccountSection
      id="sessions"
      hue="pine"
      icon={<ShieldIcon size={20} />}
      title="Active sessions"
      description="Every device currently signed in to your account. Revoke anything you do not recognise."
    >
      {revoke.isError && <Alert tone="danger">{messageFor(revoke.error)}</Alert>}
      <QueryBoundary
        isPending={sessions.isPending}
        error={sessions.error}
        isEmpty={rows.length === 0}
        skeleton={<SessionsSkeleton />}
        empty={
          <EmptyState
            icon={<ShieldIcon size={24} />}
            title="No active sessions"
            description="Sessions show up here as soon as you sign in on a device."
            action={
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshIcon size={16} />}
                loading={sessions.isFetching}
                onClick={() => {
                  void sessions.refetch();
                }}
              >
                Refresh
              </Button>
            }
          />
        }
      >
        <ul className="flex flex-col gap-3">
          {rows.map((session) => {
            const device = session.user_agent || "Unknown device";

            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-sunken/40 p-4"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-pine-soft text-pine-ink"
                >
                  <MonitorIcon size={18} />
                </span>
                <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
                  <p className="truncate text-sm font-medium text-ink" title={device}>
                    {device}
                  </p>
                  <p className={cx("flex flex-wrap items-center gap-x-2.5 gap-y-1", META_LINE)}>
                    <span>{session.client_ip || "unknown ip"}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      started{" "}
                      <time dateTime={session.created_at ?? undefined}>
                        {relativeTime(session.created_at)}
                      </time>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      used{" "}
                      <time dateTime={session.last_used_at}>
                        {relativeTime(session.last_used_at)}
                      </time>
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Revoke session on ${device}`}
                  disabled={revoke.isPending}
                  onClick={() => {
                    revoke.mutate(session.id);
                  }}
                >
                  Revoke
                </Button>
              </li>
            );
          })}
        </ul>
      </QueryBoundary>
    </AccountSection>
  );
}

function DataSection() {
  const exportData = useDataExport();

  const download = () => {
    exportData.mutate(undefined, {
      onSuccess: (data) => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "fosslove-data.json";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  return (
    <AccountSection
      id="data"
      hue="honey"
      icon={<DownloadIcon size={20} />}
      title="Your data"
      description="Export your profile, collections, favorites and script history as one JSON file."
    >
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          icon={<DownloadIcon size={16} />}
          loading={exportData.isPending}
          onClick={download}
        >
          Download my data
        </Button>
        <span className={META_LINE}>fosslove-data.json</span>
      </div>
      {exportData.isError && <Alert tone="danger">{messageFor(exportData.error)}</Alert>}
    </AccountSection>
  );
}

function DangerZoneSection() {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteAccount();
  const navigate = useNavigate();

  return (
    <AccountSection
      id="danger"
      hue="berry"
      icon={<TrashIcon size={20} />}
      title="Delete account"
      description="This permanently removes your account, collections, favorites and script history."
      danger
    >
      {confirming ? (
        <div className="flex flex-col gap-5">
          <Alert tone="danger" title="This cannot be undone.">
            Are you sure?
          </Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="danger"
              icon={<TrashIcon size={16} />}
              loading={remove.isPending}
              onClick={() => {
                remove.mutate(undefined, {
                  onSuccess: () => {
                    void navigate("/", { replace: true });
                  },
                });
              }}
            >
              Yes, delete my account
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirming(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex">
          <Button
            variant="danger"
            icon={<TrashIcon size={16} />}
            onClick={() => {
              setConfirming(true);
            }}
          >
            Delete my account
          </Button>
        </div>
      )}
      {remove.isError && <Alert tone="danger">{messageFor(remove.error)}</Alert>}
    </AccountSection>
  );
}

export function AccountPage() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <Section>
      <PageHeader
        eyebrow="your account"
        title="Account"
        description="Your profile, security, active sessions and everything we store about you."
      />
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <AccountRail active={active} />
        </div>
        <div className="flex flex-col gap-6">
          <ProfileSection />
          <ChangePasswordSection />
          <ChangeEmailSection />
          <SessionsSection />
          <DataSection />
          <DangerZoneSection />
        </div>
      </div>
    </Section>
  );
}
