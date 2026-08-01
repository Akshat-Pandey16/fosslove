import { createContext } from "react";
import type { Platform } from "@/api/types";

export interface BagItem {
  id: number;
  name: string;
  slug: string;
  platform: Platform;
}

export interface ScriptBagState {
  items: Record<Platform, BagItem[]>;
  has: (appId: number) => boolean;
  add: (item: BagItem) => void;
  remove: (appId: number) => void;
  toggle: (item: BagItem) => void;
  clear: (platform: Platform) => void;
  count: (platform: Platform) => number;
  total: number;
}

export const ScriptBagContext = createContext<ScriptBagState | null>(null);
