import { createContext } from "react";
import type { ResolvedTheme, Theme } from "./theme";

export interface ThemeState {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);
