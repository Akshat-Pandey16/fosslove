import { isApiError } from "@/api/errors";

export function messageFor(error: unknown, fallback = "Something went wrong."): string {
  if (!isApiError(error)) return fallback;
  return error.firstFieldError() ?? error.message;
}
