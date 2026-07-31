import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import type { ActivityLog, App, AppDetail, Category, Paginated, Platform } from "@/api/types";
import type { SiteConfiguration } from "@/api/types";
import { queryKeys, type AppListParams } from "@/query/keys";

export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
}

export interface AppInput {
  category_id: number;
  platform: Platform;
  name: string;
  summary?: string;
  description?: string;
  homepage_url?: string;
  license?: string;
  is_active?: boolean;
}

export interface ActivityParams {
  page?: number;
  size?: number;
  action?: string;
  status?: string;
  target_type?: string;
  user_id?: string;
  since?: string;
  until?: string;
}

export function useAdminApps(params: AppListParams = {}): UseQueryResult<Paginated<App>> {
  return useQuery({
    queryKey: queryKeys.adminApps(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/admin/apps", { params: { query: params } })),
    placeholderData: (previous) => previous,
  });
}

export function useCreateApp(): UseMutationResult<AppDetail, Error, AppInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => unwrap(await api.POST("/api/v1/admin/apps", { body: input })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
      await queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useUpdateApp(): UseMutationResult<
  AppDetail,
  Error,
  { id: number; input: Partial<AppInput> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }) =>
      unwrap(
        await api.PATCH("/api/v1/admin/apps/{id}", { params: { path: { id } }, body: input }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
      await queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useDeleteApp(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE("/api/v1/admin/apps/{id}", { params: { path: { id } } }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
      await queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useCreateCategory(): UseMutationResult<Category, Error, CategoryInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) =>
      unwrap(await api.POST("/api/v1/admin/categories", { body: input })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory(): UseMutationResult<
  Category,
  Error,
  { id: number; input: Partial<CategoryInput> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }) =>
      unwrap(
        await api.PATCH("/api/v1/admin/categories/{id}", {
          params: { path: { id } },
          body: input,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE("/api/v1/admin/categories/{id}", { params: { path: { id } } }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useActivityLog(params: ActivityParams = {}): UseQueryResult<
  Paginated<ActivityLog>
> {
  return useQuery({
    queryKey: queryKeys.adminActivity(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/admin/activity", { params: { query: params } })),
    placeholderData: (previous) => previous,
  });
}

export function useSiteConfiguration(): UseQueryResult<SiteConfiguration> {
  return useQuery({
    queryKey: queryKeys.adminSettings(),
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/settings")),
  });
}

export function useUpdateSiteConfiguration(): UseMutationResult<
  SiteConfiguration,
  Error,
  Record<string, unknown>
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) =>
      unwrap(await api.PATCH("/api/v1/admin/settings", { body: input })),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.adminSettings(), settings);
    },
  });
}

export function useRecomputeCounts(): UseMutationResult<
  { message: string; categories: number },
  Error,
  void
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/admin/recompute-counts", {})),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useCleanupTokens(): UseMutationResult<{ message: string }, Error, void> {
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/admin/cleanup-tokens", {})),
  });
}
