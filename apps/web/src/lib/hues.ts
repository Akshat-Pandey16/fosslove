import type { Platform } from "@/api/types";

export const HUES = ["ember", "honey", "moss", "pine", "sky", "cobalt", "plum", "berry"] as const;

export type Hue = (typeof HUES)[number];

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const AVALANCHE_MULTIPLIER = 0x85ebca6b;

const PLATFORM_HUES: Record<Platform, Hue> = {
  windows: "sky",
  linux: "honey",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  windows: "Windows",
  linux: "Linux",
};

function hashString(value: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  hash ^= hash >>> 15;
  hash = Math.imul(hash, AVALANCHE_MULTIPLIER);
  hash ^= hash >>> 17;
  return hash >>> 0;
}

function hueAt(index: number): Hue {
  return HUES[index % HUES.length] ?? "ember";
}

export function hueForKey(key: string): Hue {
  return hueAt(hashString(key.trim().toLowerCase()));
}

export function hueForCategory(slugOrId: string | number): Hue {
  if (typeof slugOrId === "number") {
    if (!Number.isFinite(slugOrId)) return "ember";
    return hueAt(Math.abs(Math.trunc(slugOrId)));
  }
  return hueForKey(slugOrId);
}

export function hueForEmail(email: string): Hue {
  return hueForKey(email);
}

export function platformHue(platform: Platform): Hue {
  return PLATFORM_HUES[platform];
}

export function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}

export function initialsFor(value: string): string {
  const source = value.trim();
  if (source === "") return "?";

  const separator = source.indexOf("@");
  const local = separator > 0 ? source.slice(0, separator) : source;
  const words = local.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== "");
  const [first, second] = words;

  if (first === undefined) return "?";
  if (second !== undefined) return (first.slice(0, 1) + second.slice(0, 1)).toUpperCase();
  return first.slice(0, 2).toUpperCase();
}
