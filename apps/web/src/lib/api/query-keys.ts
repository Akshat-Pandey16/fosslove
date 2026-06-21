import type { ActivityLogParams, AppListParams, PageParams } from "./types"

export const queryKeys = {
  me: ["me"] as const,
  categories: (params?: PageParams) => ["categories", params ?? {}] as const,
  category: (id: number) => ["category", id] as const,
  apps: (params?: AppListParams) => ["apps", params ?? {}] as const,
  app: (id: number) => ["app", id] as const,
  myCollections: (params?: PageParams) => ["collections", "mine", params ?? {}] as const,
  publicCollections: (params?: PageParams) => ["collections", "public", params ?? {}] as const,
  collection: (id: number) => ["collection", id] as const,
  favorites: {
    all: ["favorites"] as const,
    ids: ["favorites", "ids"] as const,
    list: (params?: PageParams) => ["favorites", "list", params ?? {}] as const,
    count: ["favorites", "count"] as const,
  },
  history: {
    all: ["history"] as const,
    list: (params?: PageParams) => ["history", "list", params ?? {}] as const,
    count: ["history", "count"] as const,
  },
  sessions: ["sessions"] as const,
  activity: (params?: ActivityLogParams) => ["activity", params ?? {}] as const,
}
