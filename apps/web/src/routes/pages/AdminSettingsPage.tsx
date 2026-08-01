import { type SyntheticEvent } from "react";
import type { SiteConfiguration } from "@/api/types";
import {
  useCatalogExport,
  useImportApps,
  useSiteConfiguration,
  useUpdateSiteConfiguration,
  type AppInput,
} from "@/features/admin/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

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
    <form onSubmit={submit}>
      <fieldset>
        <legend>Feature flags</legend>
        {BOOLEAN_FIELDS.map((field) => (
          <label key={field} htmlFor={field}>
            <input
              id={field}
              name={field}
              type="checkbox"
              defaultChecked={settings[field]}
            />
            {field}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Values</legend>
        {TEXT_FIELDS.map((field) => (
          <div key={field}>
            <label htmlFor={field}>{field}</label>
            <input id={field} name={field} defaultValue={settings[field]} />
          </div>
        ))}

        <label htmlFor="smtp_port">smtp_port</label>
        <input
          id="smtp_port"
          name="smtp_port"
          type="number"
          defaultValue={settings.smtp_port}
        />

        <label htmlFor="smtp_password">
          smtp_password {settings.smtp_password_set && "(set — leave blank to keep)"}
        </label>
        <input id="smtp_password" name="smtp_password" type="password" autoComplete="off" />
      </fieldset>

      {update.isError && <p role="alert">{messageFor(update.error)}</p>}
      {update.isSuccess && <p>Settings saved.</p>}

      <button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function CatalogTransferSection() {
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
    const apps = Array.isArray(parsed)
      ? parsed
      : ((parsed as { apps?: unknown[] }).apps ?? []);
    importApps.mutate(apps as AppInput[]);
  };

  return (
    <section>
      <h2>Catalog import and export</h2>

      <button type="button" disabled={exportCatalog.isPending} onClick={download}>
        {exportCatalog.isPending ? "Exporting…" : "Export catalog"}
      </button>
      {exportCatalog.isError && <p role="alert">{messageFor(exportCatalog.error)}</p>}

      <label htmlFor="import-file">Import apps from JSON</label>
      <input
        id="import-file"
        type="file"
        accept="application/json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) void upload(file);
        }}
      />
      {importApps.isPending && <p aria-busy="true">Importing…</p>}
      {importApps.isError && <p role="alert">{messageFor(importApps.error)}</p>}
      {importApps.isSuccess && <p>Imported {importApps.data.length} apps.</p>}
    </section>
  );
}

export function AdminSettingsPage() {
  const settings = useSiteConfiguration();

  return (
    <>
      <h1>Runtime settings</h1>
      <p>Blank values inherit from the environment configuration.</p>

      {settings.isPending && <p aria-busy="true">Loading settings…</p>}
      {settings.isError && <p role="alert">{messageFor(settings.error)}</p>}
      {settings.data && <SettingsForm settings={settings.data} />}

      <CatalogTransferSection />
    </>
  );
}
