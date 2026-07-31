import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/errors";

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount >= 2) return false;
          return isApiError(error) ? RETRYABLE_STATUSES.has(error.status) : true;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
