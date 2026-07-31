import createClient from "openapi-fetch";
import { toApiError } from "./errors";
import type { paths } from "./schema";
import { getAccessToken, getTokens, setTokens } from "./tokens";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const REFRESH_PATH = "/api/v1/auth/refresh";

let refreshInFlight: Promise<string | null> | null = null;

async function requestFreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (tokens === null) return null;

  const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });

  if (!response.ok) {
    setTokens(null);
    return null;
  }

  const body = (await response.json()) as { access?: string; refresh?: string };
  if (body.access === undefined) {
    setTokens(null);
    return null;
  }

  setTokens({ access: body.access, refresh: body.refresh ?? tokens.refresh });
  return body.access;
}

function refreshOnce(): Promise<string | null> {
  refreshInFlight ??= requestFreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export const authFetch: typeof fetch = async (input, init) => {
  const base = new Request(input, init);

  const send = (token: string | null): Promise<Response> => {
    const request = base.clone();
    if (token !== null) request.headers.set("Authorization", `Bearer ${token}`);
    return fetch(request);
  };

  const response = await send(getAccessToken());
  if (response.status !== 401 || base.url.endsWith(REFRESH_PATH) || getTokens() === null) {
    return response;
  }

  const refreshed = await refreshOnce();
  return refreshed === null ? response : send(refreshed);
};

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: authFetch,
});

export function unwrap<TData>(result: {
  data?: TData;
  error?: unknown;
  response: Response;
}): TData {
  if (!result.response.ok) {
    throw toApiError(result.response.status, result.error);
  }
  return result.data as TData;
}
