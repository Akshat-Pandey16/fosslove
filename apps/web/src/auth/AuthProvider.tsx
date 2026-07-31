import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, unwrap } from "@/api/client";
import { getTokens, setTokens, subscribeToTokens } from "@/api/tokens";
import type { User } from "@/api/types";
import { queryKeys } from "@/query/keys";
import { AuthContext, type AuthState, type RegisterInput } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasTokens, setHasTokens] = useState(() => getTokens() !== null);

  useEffect(() => subscribeToTokens((tokens) => { setHasTokens(tokens !== null); }), []);

  const { data: user = null, isLoading } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => unwrap(await api.GET("/api/v1/user/")),
    enabled: hasTokens,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = unwrap(
        await api.POST("/api/v1/auth/login", { body: { email, password } }),
      );
      setTokens({ access: tokens.access, refresh: tokens.refresh });
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
    [queryClient],
  );

  const register = useCallback(async (input: RegisterInput): Promise<User> => {
    return unwrap(await api.POST("/api/v1/auth/register", { body: input }));
  }, []);

  const logout = useCallback(async () => {
    const tokens = getTokens();
    if (tokens !== null) {
      await api.POST("/api/v1/auth/logout", { body: { refresh: tokens.refresh } });
    }
    setTokens(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading: hasTokens && isLoading,
      isAuthenticated: user !== null,
      isVerified: user?.is_verified ?? false,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
    }),
    [user, hasTokens, isLoading, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
