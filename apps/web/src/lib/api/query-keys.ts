import type { AppListParams, PageParams } from "./types"

export const queryKeys = {
  me: ["me"] as const,
  categories: (params?: PageParams) => ["categories", params ?? {}] as const,
  category: (id: number) => ["category", id] as const,
  apps: (params?: AppListParams) => ["apps", params ?? {}] as const,
  app: (id: number) => ["app", id] as const,
  myCollections: (params?: PageParams) => ["collections", "mine", params ?? {}] as const,
  publicCollections: (params?: PageParams) => ["collections", "public", params ?? {}] as const,
  collection: (id: number) => ["collection", id] as const,
  favorites: (params?: PageParams) => ["favorites", params ?? {}] as const,
  history: (params?: PageParams) => ["history", params ?? {}] as const,
}
