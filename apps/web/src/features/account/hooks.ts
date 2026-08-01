import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { setTokens } from "@/api/tokens";
import type { DataExport, Session, User } from "@/api/types";
import { queryKeys } from "@/query/keys";

export function useUpdateProfile(): UseMutationResult<User, Error, { full_name?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => unwrap(await api.PATCH("/api/v1/user/", { body: input })),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me(), user);
    },
  });
}

export function useChangePassword(): UseMutationResult<
  { message: string },
  Error,
  { current_password: string; new_password: string }
> {
  return useMutation({
    mutationFn: async (input) =>
      unwrap(await api.POST("/api/v1/user/change-password", { body: input })),
    onSuccess: () => {
      setTokens(null);
    },
  });
}

export function useRequestEmailChange(): UseMutationResult<
  { message: string },
  Error,
  { new_email: string; current_password: string }
> {
  return useMutation({
    mutationFn: async (input) => unwrap(await api.POST("/api/v1/user/email", { body: input })),
  });
}

export function useSessions(): UseQueryResult<Session[]> {
  return useQuery({
    queryKey: queryKeys.sessions(),
    queryFn: async () => unwrap(await api.GET("/api/v1/user/sessions")),
  });
}

export function useRevokeSession(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      unwrap(await api.DELETE("/api/v1/user/sessions/{id}", { params: { path: { id } } }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
    },
  });
}

export function useDeleteAccount(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      unwrap(await api.DELETE("/api/v1/user/"));
    },
    onSuccess: () => {
      setTokens(null);
      queryClient.clear();
    },
  });
}

export function useDataExport(): UseMutationResult<DataExport, Error, void> {
  return useMutation({
    mutationFn: async () => unwrap(await api.GET("/api/v1/user/export")),
  });
}
