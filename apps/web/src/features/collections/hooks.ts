import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import type { Collection, CollectionDetail, Paginated } from "@/api/types";
import { queryKeys } from "@/query/keys";

export interface CollectionInput {
  name: string;
  description?: string;
  is_public?: boolean;
  app_ids?: number[];
}

interface PageParams {
  page?: number;
  size?: number;
}

export function useCollections(params: PageParams = {}): UseQueryResult<Paginated<Collection>> {
  return useQuery({
    queryKey: queryKeys.collections(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/collections", { params: { query: params } })),
  });
}

export function usePublicCollections(
  params: PageParams = {},
): UseQueryResult<Paginated<Collection>> {
  return useQuery({
    queryKey: queryKeys.publicCollections(params),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/collections/public", { params: { query: params } })),
  });
}

export function useCollection(id: number): UseQueryResult<CollectionDetail> {
  return useQuery({
    queryKey: queryKeys.collection(id),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/collections/{id}", { params: { path: { id } } })),
    enabled: Number.isFinite(id),
  });
}

export function useCreateCollection(): UseMutationResult<
  CollectionDetail,
  Error,
  CollectionInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CollectionInput) =>
      unwrap(await api.POST("/api/v1/collections", { body: input })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection(
  id: number,
): UseMutationResult<CollectionDetail, Error, Partial<CollectionInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CollectionInput>) =>
      unwrap(
        await api.PATCH("/api/v1/collections/{id}", { params: { path: { id } }, body: input }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collection(id) });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useSetCollectionApps(
  id: number,
): UseMutationResult<CollectionDetail, Error, number[]> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appIds: number[]) =>
      unwrap(
        await api.PATCH("/api/v1/collections/{id}/apps", {
          params: { path: { id } },
          body: { app_ids: appIds },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collection(id) });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteCollection(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE("/api/v1/collections/{id}", { params: { path: { id } } }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
