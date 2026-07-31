import { describe, expect, it, vi } from "vitest";
import { getAccessToken, getTokens, setTokens, subscribeToTokens } from "./tokens";

describe("token store", () => {
  it("round-trips a token pair", () => {
    setTokens({ access: "a", refresh: "r" });

    expect(getTokens()).toEqual({ access: "a", refresh: "r" });
    expect(getAccessToken()).toBe("a");
  });

  it("reports no tokens once cleared", () => {
    setTokens({ access: "a", refresh: "r" });
    setTokens(null);

    expect(getTokens()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("notifies subscribers until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTokens(listener);

    setTokens({ access: "a", refresh: "r" });
    expect(listener).toHaveBeenCalledWith({ access: "a", refresh: "r" });

    unsubscribe();
    setTokens(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
