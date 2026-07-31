import { afterEach, beforeEach } from "vitest";

beforeEach(() => {
  globalThis.localStorage.clear();
});

afterEach(() => {
  globalThis.localStorage.clear();
});
