import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import type { App, AppDetail, Category, Paginated, Platform } from "@/api/types";
import { queryKeys, type AppListParams } from "@/query/keys";

export function useCategories(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Paginated<Category>> {
  return useQuery({
    queryKey: queryKeys.categories(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/categories", { params: { query: params } })),
  });
}

export function useCategoryBySlug(slug: string): UseQueryResult<Category> {
  return useQuery({
    queryKey: queryKeys.categoryBySlug(slug),
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/categories/by-slug/{slug}", { params: { path: { slug } } }),
      ),
    enabled: slug !== "",
  });
}

export function useApps(params: AppListParams = {}): UseQueryResult<Paginated<App>> {
  return useQuery({
    queryKey: queryKeys.apps(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/apps", { params: { query: params } })),
    placeholderData: (previous) => previous,
  });
}

export function useApp(id: number): UseQueryResult<AppDetail> {
  return useQuery({
    queryKey: queryKeys.app(id),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/apps/{id}", { params: { path: { id } } })),
    enabled: Number.isFinite(id),
  });
}

export function useAppBySlug(platform: Platform, slug: string): UseQueryResult<AppDetail> {
  return useQuery({
    queryKey: queryKeys.appBySlug(platform, slug),
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/apps/by-slug/{platform}/{slug}", {
          params: { path: { platform, slug } },
        }),
      ),
    enabled: slug !== "",
  });
}
