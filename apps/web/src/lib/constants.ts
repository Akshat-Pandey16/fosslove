import type { PackageManager, Platform } from "@/lib/api/types"

export const PLATFORM_LABELS: Record<Platform, string> = {
  windows: "Windows",
  linux: "Linux",
}

export const MANAGER_LABELS: Record<PackageManager, string> = {
  winget: "winget",
  msstore: "Microsoft Store",
  apt: "APT",
  dnf: "DNF",
  pacman: "pacman",
  flatpak: "Flatpak",
  snap: "Snap",
  direct: "Direct download",
}

export const PLATFORMS: Platform[] = ["windows", "linux"]

export const PACKAGE_MANAGERS: PackageManager[] = [
  "winget",
  "msstore",
  "apt",
  "dnf",
  "pacman",
  "flatpak",
  "snap",
  "direct",
]

export const PAGE_SIZE = 24

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function scriptFilename(platform: Platform): string {
  return platform === "windows" ? "install_apps.ps1" : "install_apps.sh"
}
