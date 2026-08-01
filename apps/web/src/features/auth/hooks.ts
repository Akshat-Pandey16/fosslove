import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";

interface Message {
  message: string;
}

export function useVerifyEmail(): UseMutationResult<
  Message,
  Error,
  { uid: string; token: string }
> {
  return useMutation({
    mutationFn: async (body) => unwrap(await api.POST("/api/v1/auth/verify-email", { body })),
  });
}

export function useResendVerification(): UseMutationResult<Message, Error, { email: string }> {
  return useMutation({
    mutationFn: async (body) =>
      unwrap(await api.POST("/api/v1/auth/resend-verification", { body })),
  });
}

export function useRequestPasswordReset(): UseMutationResult<Message, Error, { email: string }> {
  return useMutation({
    mutationFn: async (body) => unwrap(await api.POST("/api/v1/auth/password-reset", { body })),
  });
}

export function useConfirmPasswordReset(): UseMutationResult<
  Message,
  Error,
  { uid: string; token: string; new_password: string }
> {
  return useMutation({
    mutationFn: async (body) =>
      unwrap(await api.POST("/api/v1/auth/password-reset/confirm", { body })),
  });
}

export function useConfirmEmailChange(): UseMutationResult<Message, Error, { token: string }> {
  return useMutation({
    mutationFn: async (body) =>
      unwrap(await api.POST("/api/v1/auth/email-change/confirm", { body })),
  });
}
