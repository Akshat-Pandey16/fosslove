import { useState, type DragEvent, type ReactNode, type SyntheticEvent } from "react";
import type { SiteConfiguration } from "@/api/types";
import { AdminShell } from "@/components/AdminNav";
import { QueryBoundary } from "@/components/QueryBoundary";
import {
  useCatalogExport,
  useImportApps,
  useSiteConfiguration,
  useUpdateSiteConfiguration,
  type AppInput,
} from "@/features/admin/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import type { Hue } from "@/lib/hues";
import {
  Alert,
  Button,
  Card,
  DownloadIcon,
  Eyebrow,
  Field,
  Input,
  PageHeader,
  Skeleton,
  Switch,
  UploadIcon,
  cx,
} from "@/ui";

const BOOLEAN_FIELDS = [
  "registration_enabled",
  "email_enabled",
  "rate_limit_enabled",
  "smtp_use_tls",
] as const satisfies readonly (keyof SiteConfiguration)[];

const TEXT_FIELDS = [
  "rate_limit_default",
  "rate_limit_auth",
  "email_backend",
  "email_from",
  "smtp_host",
  "smtp_user",
  "project_name",
  "frontend_base_url",
] as const satisfies readonly (keyof SiteConfiguration)[];

type BooleanField = (typeof BOOLEAN_FIELDS)[number];
type TextField = (typeof TEXT_FIELDS)[number];
type SettingsField = BooleanField | TextField | "smtp_port" | "smtp_password";

const LABELS: Record<SettingsField, string> = {
  registration_enabled: "Allow new registrations",
  email_enabled: "Send transactional email",
  rate_limit_enabled: "Enforce rate limits",
  smtp_use_tls: "Use TLS",
  rate_limit_default: "Default rate",
  rate_limit_auth: "Auth rate",
  email_backend: "Email backend",
  email_from: "From address",
  smtp_host: "SMTP host",
  smtp_user: "SMTP user",
  smtp_port: "SMTP port",
  smtp_password: "SMTP password",
  project_name: "Project name",
  frontend_base_url: "Frontend base URL",
};

const HINTS: Partial<Record<SettingsField, string>> = {
  registration_enabled: "When off, the sign-up endpoint is closed.",
  email_enabled: "When off, new accounts are auto-verified and email flows short-circuit.",
  rate_limit_enabled: "Applies DRF throttling to every endpoint.",
  rate_limit_default: "Throttle rate for anonymous and general traffic, e.g. 200/minute.",
  rate_limit_auth: "Throttle rate for the authentication endpoints, e.g. 10/minute.",
  email_backend: "console or smtp.",
  email_from: "Envelope sender for every outgoing message.",
  frontend_base_url: "Used to build the links inside emails.",
};

const FLAG_FIELDS: readonly BooleanField[] = [
  "registration_enabled",
  "email_enabled",
  "rate_limit_enabled",
];

const RATE_FIELDS: readonly TextField[] = ["rate_limit_default", "rate_limit_auth"];

const EMAIL_FIELDS: readonly TextField[] = [
  "email_backend",
  "email_from",
  "smtp_host",
  "smtp_user",
];

const BRANDING_FIELDS: readonly TextField[] = ["project_name", "frontend_base_url"];

const MONO_FIELDS: readonly TextField[] = [
  "rate_limit_default",
  "rate_limit_auth",
  "email_backend",
  "smtp_host",
  "frontend_base_url",
];

function SettingsCard({
  eyebrow,
  hue,
  title,
  description,
  children,
}: {
  eyebrow: string;
  hue: Hue;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Eyebrow hue={hue}>{eyebrow}</Eyebrow>
        <h2 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </Card>
  );
}

function TextSetting({ field, settings }: { field: TextField; settings: SiteConfiguration }) {
  const hint = HINTS[field];

  return (
    <Field
      label={LABELS[field]}
      htmlFor={field}
      {...(hint === undefined ? {} : { hint })}
    >
      <Input
        id={field}
        name={field}
        defaultValue={settings[field]}
        className={cx(MONO_FIELDS.includes(field) && "font-mono")}
      />
    </Field>
  );
}

function BooleanSetting({ field, settings }: { field: BooleanField; settings: SiteConfiguration }) {
  const hint = HINTS[field];

  return (
    <Switch
      id={field}
      name={field}
      label={LABELS[field]}
      defaultChecked={settings[field]}
      {...(hint === undefined ? {} : { description: hint })}
    />
  );
}

function SettingsForm({ settings }: { settings: SiteConfiguration }) {
  const update = useUpdateSiteConfiguration();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};

    for (const field of BOOLEAN_FIELDS) payload[field] = form.get(field) !== null;
    for (const field of TEXT_FIELDS) payload[field] = formString(form, field);
    payload.smtp_port = Number(formString(form, "smtp_port"));

    const password = formString(form, "smtp_password");
    if (password !== "") payload.smtp_password = password;

    update.mutate(payload);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SettingsCard
            eyebrow="feature flags"
            hue="moss"
            title="Feature flags"
            description="Switch whole subsystems on and off without a redeploy."
          >
            {FLAG_FIELDS.map((field) => (
              <BooleanSetting key={field} field={field} settings={settings} />
            ))}
          </SettingsCard>

          <SettingsCard
            eyebrow="rate limits"
            hue="honey"
            title="Rate limits"
            description="Throttle rates in Django REST Framework notation."
          >
            {RATE_FIELDS.map((field) => (
              <TextSetting key={field} field={field} settings={settings} />
            ))}
          </SettingsCard>

          <SettingsCard
            eyebrow="branding"
            hue="plum"
            title="Branding"
            description="Names and links that appear in the product and in outgoing email."
          >
            {BRANDING_FIELDS.map((field) => (
              <TextSetting key={field} field={field} settings={settings} />
            ))}
          </SettingsCard>
        </div>

        <SettingsCard
          eyebrow="email · smtp"
          hue="sky"
          title="Email & SMTP"
          description="Delivery settings for verification, password reset and email-change messages."
        >
          {EMAIL_FIELDS.map((field) => (
            <TextSetting key={field} field={field} settings={settings} />
          ))}

          <Field label={LABELS.smtp_port} htmlFor="smtp_port">
            <Input
              id="smtp_port"
              name="smtp_port"
              type="number"
              defaultValue={settings.smtp_port}
              className="font-mono"
            />
          </Field>

          <Field
            label={LABELS.smtp_password}
            htmlFor="smtp_password"
            {...(settings.smtp_password_set
              ? { hint: "A password is stored. Leave blank to keep it." }
              : {})}
          >
            <Input id="smtp_password" name="smtp_password" type="password" autoComplete="off" />
          </Field>

          <BooleanSetting field="smtp_use_tls" settings={settings} />
        </SettingsCard>
      </div>

      {update.error === null ? null : <Alert tone="danger">{messageFor(update.error)}</Alert>}
      {update.isSuccess && <Alert tone="success">Settings saved.</Alert>}

      <div>
        <Button type="submit" loading={update.isPending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

function SettingsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, card) => (
        <div key={card} className="rounded-xl border border-line bg-surface p-6 shadow-soft">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-4 h-6 w-40" />
          <div className="mt-6 flex flex-col gap-5">
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalogTransferSection() {
  const [dragging, setDragging] = useState(false);
  const exportCatalog = useCatalogExport();
  const importApps = useImportApps();

  const download = () => {
    exportCatalog.mutate(undefined, {
      onSuccess: (data) => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "fosslove-catalog.json";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  const upload = async (file: File) => {
    const parsed: unknown = JSON.parse(await file.text());
    const apps = Array.isArray(parsed) ? parsed : ((parsed as { apps?: unknown[] }).apps ?? []);
    importApps.mutate(apps as AppInput[]);
  };

  const drop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file !== undefined) void upload(file);
  };

  return (
    <section className="mt-14 flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Eyebrow hue="pine">catalog transfer</Eyebrow>
        <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-ink">
          Import and export
        </h2>
      </div>

      <Card className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-lg leading-tight text-ink">Export catalog</h3>
            <p className="text-sm leading-relaxed text-ink-muted">
              Downloads every category and app as a single JSON document.
            </p>
          </div>

          <Button
            variant="secondary"
            loading={exportCatalog.isPending}
            icon={<DownloadIcon size={16} />}
            onClick={download}
            className="self-start"
          >
            Export catalog
          </Button>

          {exportCatalog.error === null ? null : (
            <Alert tone="danger">{messageFor(exportCatalog.error)}</Alert>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-lg leading-tight text-ink">Import apps</h3>
            <p className="text-sm leading-relaxed text-ink-muted">
              Accepts an array of apps, or an export file with an{" "}
              <code className="font-mono text-xs text-ink">apps</code> key.
            </p>
          </div>

          <label
            htmlFor="import-file"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => {
              setDragging(false);
            }}
            onDrop={drop}
            className={cx(
              "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors duration-200",
              dragging ? "border-ember bg-ember-soft" : "border-line-strong bg-sunken",
            )}
          >
            <UploadIcon size={22} className="text-ink-muted" />
            <span className="text-sm font-medium text-ink">Drop a catalog JSON file here</span>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint">
              or click to choose a file
            </span>
            <input
              id="import-file"
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file !== undefined) void upload(file);
              }}
            />
          </label>

          {importApps.isPending && <Alert tone="info">Importing apps…</Alert>}
          {importApps.error === null ? null : (
            <Alert tone="danger">{messageFor(importApps.error)}</Alert>
          )}
          {importApps.isSuccess && (
            <Alert tone="success">Imported {importApps.data.length} apps.</Alert>
          )}
        </div>
      </Card>
    </section>
  );
}

export function AdminSettingsPage() {
  const settings = useSiteConfiguration();

  return (
    <AdminShell>
      <PageHeader
        eyebrow="admin · settings"
        title="Runtime settings"
        description="These overlay the environment configuration. A blank value inherits whatever the environment provides."
      />

      <QueryBoundary
        isPending={settings.isPending}
        error={settings.error}
        skeleton={<SettingsSkeleton />}
      >
        {settings.data === undefined ? null : <SettingsForm settings={settings.data} />}
      </QueryBoundary>

      <CatalogTransferSection />
    </AdminShell>
  );
}
