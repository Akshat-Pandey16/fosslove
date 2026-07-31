import type { Platform } from "@/api/types";

export interface AppListParams {
  platform?: Platform;
  category_id?: number;
  q?: string;
  page?: number;
  size?: number;
}

export const queryKeys = {
  categories: (params?: object) => ["categories", params ?? {}] as const,
  category: (id: number) => ["category", id] as const,
  categoryBySlug: (slug: string) => ["category", "slug", slug] as const,

  apps: (params: AppListParams) => ["apps", params] as const,
  app: (id: number) => ["app", id] as const,
  appBySlug: (platform: string, slug: string) => ["app", platform, slug] as const,

  me: () => ["me"] as const,
  sessions: () => ["sessions"] as const,
  dataExport: () => ["data-export"] as const,

  collections: (params?: object) => ["collections", params ?? {}] as const,
  publicCollections: (params?: object) => ["collections", "public", params ?? {}] as const,
  collection: (id: number) => ["collection", id] as const,

  favorites: (params?: object) => ["favorites", params ?? {}] as const,
  favoriteIds: () => ["favorites", "ids"] as const,

  scriptHistory: (params?: object) => ["scripts", "history", params ?? {}] as const,

  adminApps: (params?: object) => ["admin", "apps", params ?? {}] as const,
  adminActivity: (params?: object) => ["admin", "activity", params ?? {}] as const,
  adminSettings: () => ["admin", "settings"] as const,
  adminCatalogExport: () => ["admin", "catalog", "export"] as const,
} as const;
