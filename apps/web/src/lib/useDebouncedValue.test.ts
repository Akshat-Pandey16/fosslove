import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("firefox", 300));
    expect(result.current).toBe("firefox");
  });

  it("collapses a burst of keystrokes into a single settled value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "f" },
    });

    for (const value of ["fi", "fir", "fire", "firef", "firefo", "firefox"]) {
      rerender({ value });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current).toBe("f");
    }

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("firefox");
  });
});
