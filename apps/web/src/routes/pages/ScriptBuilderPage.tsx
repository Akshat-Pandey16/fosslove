import { useState } from "react";
import { PLATFORMS, type Platform } from "@/api/types";
import { useApps } from "@/features/catalog/hooks";
import { downloadScript, useGenerateScript } from "@/features/scripts/hooks";

export function ScriptBuilderPage() {
  const [platform, setPlatform] = useState<Platform>("linux");
  const [selected, setSelected] = useState<number[]>([]);

  const apps = useApps({ platform, size: 100 });
  const generate = useGenerateScript();

  const toggle = (id: number) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const build = () => {
    generate.mutate(
      { platform, app_ids: selected },
      { onSuccess: (script) => { downloadScript(script); } },
    );
  };

  return (
    <section>
      <h1>Script builder</h1>

      <fieldset>
        <legend>Platform</legend>
        {PLATFORMS.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="platform"
              value={value}
              checked={platform === value}
              onChange={() => {
                setPlatform(value);
                setSelected([]);
              }}
            />
            {value}
          </label>
        ))}
      </fieldset>

      {apps.isPending && <p aria-busy="true">Loading apps…</p>}

      <ul>
        {apps.data?.items.map((app) => (
          <li key={app.id}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(app.id)}
                onChange={() => { toggle(app.id); }}
              />
              {app.name}
            </label>
          </li>
        ))}
      </ul>

      <button type="button" disabled={selected.length === 0 || generate.isPending} onClick={build}>
        {generate.isPending ? "Generating…" : `Generate script (${selected.length})`}
      </button>

      {generate.isError && <p role="alert">{generate.error.message}</p>}

      {generate.data && generate.data.skipped.length > 0 && (
        <p>No installer available for: {generate.data.skipped.join(", ")}</p>
      )}
    </section>
  );
}
