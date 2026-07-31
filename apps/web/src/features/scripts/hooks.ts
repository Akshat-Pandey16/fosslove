import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { API_BASE_URL, api, authFetch, unwrap } from "@/api/client";
import { toApiError } from "@/api/errors";
import type { Paginated, Platform, ScriptRun } from "@/api/types";
import { queryKeys } from "@/query/keys";

export interface ScriptRequest {
  platform: Platform;
  app_ids?: number[];
  collection_id?: number;
}

export interface GeneratedScript {
  filename: string;
  content: string;
  skipped: string[];
}

const FILENAME_PATTERN = /filename="?([^"';]+)"?/;

function parseFilename(header: string | null, platform: Platform): string {
  const match = header === null ? null : FILENAME_PATTERN.exec(header);
  return match?.[1] ?? (platform === "windows" ? "install_apps.ps1" : "install_apps.sh");
}

export async function generateScript(request: ScriptRequest): Promise<GeneratedScript> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/scripts/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw toApiError(response.status, await response.json().catch(() => undefined));
  }

  const skipped = response.headers.get("X-Fosslove-Skipped");
  return {
    filename: parseFilename(response.headers.get("Content-Disposition"), request.platform),
    content: await response.text(),
    skipped: skipped === null || skipped === "" ? [] : skipped.split(",").map((s) => s.trim()),
  };
}

export function downloadScript(script: GeneratedScript): void {
  const url = URL.createObjectURL(new Blob([script.content], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = script.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useGenerateScript(): UseMutationResult<GeneratedScript, Error, ScriptRequest> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateScript,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useScriptHistory(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Paginated<ScriptRun>> {
  return useQuery({
    queryKey: queryKeys.scriptHistory(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/scripts/history", { params: { query: params } })),
  });
}
