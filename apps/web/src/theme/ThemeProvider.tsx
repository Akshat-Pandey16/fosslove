import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ThemeContext, type ThemeState } from "./context";
import {
  applyResolvedTheme,
  prefersDark,
  readStoredTheme,
  storeTheme,
  subscribeToSystemTheme,
  type ResolvedTheme,
  type Theme,
} from "./theme";

function systemFallback() {
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, prefersDark, systemFallback);

  const resolved: ResolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    applyResolvedTheme(resolved);
  }, [resolved]);

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next);
    setThemeState(next);
  }, []);

  const value = useMemo<ThemeState>(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
