"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppListItem, Platform } from "@/lib/api/types"

export interface BuilderItem {
  id: number
  name: string
  slug: string
  platform: Platform
  category_name: string
}

interface BuilderState {
  items: BuilderItem[]
  add: (app: AppListItem) => void
  remove: (id: number) => void
  toggle: (app: AppListItem) => void
  clearPlatform: (platform: Platform) => void
  clear: () => void
}

function toItem(app: AppListItem): BuilderItem {
  return {
    id: app.id,
    name: app.name,
    slug: app.slug,
    platform: app.platform,
    category_name: app.category_name,
  }
}

export const useBuilder = create<BuilderState>()(
  persist(
    (set) => ({
      items: [],
      add: (app) =>
        set((state) =>
          state.items.some((item) => item.id === app.id)
            ? state
            : { items: [...state.items, toItem(app)] },
        ),
      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      toggle: (app) =>
        set((state) =>
          state.items.some((item) => item.id === app.id)
            ? { items: state.items.filter((item) => item.id !== app.id) }
            : { items: [...state.items, toItem(app)] },
        ),
      clearPlatform: (platform) =>
        set((state) => ({ items: state.items.filter((item) => item.platform !== platform) })),
      clear: () => set({ items: [] }),
    }),
    { name: "fosslove.builder", skipHydration: true },
  ),
)

export function useBuilderCount(): number {
  return useBuilder((state) => state.items.length)
}

export function useInBuilder(id: number): boolean {
  return useBuilder((state) => state.items.some((item) => item.id === id))
}
