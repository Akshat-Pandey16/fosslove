import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import type { App, Paginated } from "@/api/types";
import { queryKeys } from "@/query/keys";

export function useFavorites(
  params: { page?: number; size?: number } = {},
): UseQueryResult<Paginated<App>> {
  return useQuery({
    queryKey: queryKeys.favorites(params),
    queryFn: async () => unwrap(await api.GET("/api/v1/favorites", { params: { query: params } })),
  });
}

export function useFavoriteIds(enabled: boolean): UseQueryResult<number[]> {
  return useQuery({
    queryKey: queryKeys.favoriteIds(),
    queryFn: async () => unwrap(await api.GET("/api/v1/favorites/ids")),
    enabled,
  });
}

export function useToggleFavorite(): UseMutationResult<
  void,
  Error,
  { appId: number; isFavorite: boolean },
  { previous: number[] | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appId, isFavorite }) => {
      const options = { params: { path: { app_id: appId } } };
      unwrap(
        isFavorite
          ? await api.DELETE("/api/v1/favorites/{app_id}", options)
          : await api.POST("/api/v1/favorites/{app_id}", options),
      );
    },
    onMutate: async ({ appId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favoriteIds() });
      const previous = queryClient.getQueryData<number[]>(queryKeys.favoriteIds());
      queryClient.setQueryData<number[]>(queryKeys.favoriteIds(), (current = []) =>
        isFavorite ? current.filter((id) => id !== appId) : [...current, appId],
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.favoriteIds(), context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
