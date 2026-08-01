import { PLATFORMS, isPlatform, type Platform } from "@/api/types";
import type { BagItem } from "./context";

export const SCRIPT_BAG_STORAGE_KEY = "fosslove-script-bag";

export function emptyBag(): Record<Platform, BagItem[]> {
  return { windows: [], linux: [] };
}

function toItem(value: unknown): BagItem | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const { id, name, slug, platform } = raw;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;
  if (typeof name !== "string" || typeof slug !== "string") return null;
  if (typeof platform !== "string" || !isPlatform(platform)) return null;
  return { id, name, slug, platform };
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SCRIPT_BAG_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readBag(): Record<Platform, BagItem[]> {
  const bag = emptyBag();
  const stored = readRaw();
  if (stored === null) return bag;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return bag;
  }
  if (typeof parsed !== "object" || parsed === null) return bag;

  const record = parsed as Record<string, unknown>;
  for (const platform of PLATFORMS) {
    const list = record[platform];
    if (!Array.isArray(list)) continue;
    const seen = new Set<number>();
    for (const entry of list) {
      const item = toItem(entry);
      if (item === null) continue;
      if (item.platform !== platform || seen.has(item.id)) continue;
      seen.add(item.id);
      bag[platform].push(item);
    }
  }
  return bag;
}

export function writeBag(bag: Record<Platform, BagItem[]>): void {
  try {
    window.localStorage.setItem(SCRIPT_BAG_STORAGE_KEY, JSON.stringify(bag));
  } catch {
    return;
  }
}
