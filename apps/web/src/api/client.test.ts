import { beforeEach, describe, expect, it, vi } from "vitest";
import { authFetch } from "./client";
import { getTokens, setTokens } from "./tokens";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("authFetch", () => {
  beforeEach(() => {
    setTokens(null);
  });

  it("sends no Authorization header when signed out", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.test/api/v1/apps");

    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.headers.get("Authorization")).toBeNull();
  });

  it("attaches the access token when signed in", async () => {
    setTokens({ access: "access-1", refresh: "refresh-1" });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.test/api/v1/user/");

    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.headers.get("Authorization")).toBe("Bearer access-1");
  });

  it("refreshes once and retries after a 401", async () => {
    setTokens({ access: "stale", refresh: "refresh-1" });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: "fresh", refresh: "refresh-2" }))
      .mockResolvedValueOnce(jsonResponse({ email: "user@test.io" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await authFetch("https://api.test/api/v1/user/");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getTokens()).toEqual({ access: "fresh", refresh: "refresh-2" });

    const retry = fetchMock.mock.calls[2]?.[0] as Request;
    expect(retry.headers.get("Authorization")).toBe("Bearer fresh");
  });

  it("refreshes only once for concurrent 401s so rotation cannot reject a reused token", async () => {
    setTokens({ access: "stale", refresh: "refresh-1" });

    let refreshCalls = 0;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = input instanceof Request ? input.url : String(input);
      const token =
        input instanceof Request ? input.headers.get("Authorization") : null;

      if (url.endsWith("/api/v1/auth/refresh")) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse({ access: "fresh", refresh: "refresh-2" }));
      }
      if (token === "Bearer stale") {
        return Promise.resolve(jsonResponse({ detail: "expired" }, 401));
      }
      return Promise.resolve(jsonResponse({ ok: true }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const responses = await Promise.all([
      authFetch("https://api.test/api/v1/user/"),
      authFetch("https://api.test/api/v1/favorites"),
      authFetch("https://api.test/api/v1/collections"),
    ]);

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(refreshCalls).toBe(1);
  });

  it("clears tokens and returns the 401 when the refresh is rejected", async () => {
    setTokens({ access: "stale", refresh: "revoked" });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ detail: "blacklisted" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    const response = await authFetch("https://api.test/api/v1/user/");

    expect(response.status).toBe(401);
    expect(getTokens()).toBeNull();
  });

  it("does not try to refresh the refresh endpoint itself", async () => {
    setTokens({ access: "stale", refresh: "revoked" });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ detail: "blacklisted" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    const response = await authFetch("https://api.test/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh: "revoked" }),
    });

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
