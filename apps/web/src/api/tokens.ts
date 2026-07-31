const ACCESS_KEY = "fosslove.access";
const REFRESH_KEY = "fosslove.refresh";

export interface TokenPair {
  access: string;
  refresh: string;
}

type Listener = (tokens: TokenPair | null) => void;

const listeners = new Set<Listener>();

function read(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) {
      globalThis.localStorage.removeItem(key);
    } else {
      globalThis.localStorage.setItem(key, value);
    }
  } catch {
    return;
  }
}

export function getTokens(): TokenPair | null {
  const access = read(ACCESS_KEY);
  const refresh = read(REFRESH_KEY);
  return access !== null && refresh !== null ? { access, refresh } : null;
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY);
}

export function setTokens(tokens: TokenPair | null): void {
  write(ACCESS_KEY, tokens?.access ?? null);
  write(REFRESH_KEY, tokens?.refresh ?? null);
  for (const listener of listeners) listener(tokens);
}

export function subscribeToTokens(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
