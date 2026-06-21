"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import { applyApiError } from "@/lib/api/form-errors"

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(128, "At most 128 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })

type Values = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  })

  const onSubmit = async (values: Values) => {
    try {
      await api.auth.confirmPasswordReset(token, values.password)
      toast.success("Password updated. Please sign in.")
      router.push("/login")
    } catch (error) {
      if (!applyApiError(error, form)) {
        toast.error(errorMessage(error))
      }
    }
  }

  return (
    <Window
      label="~/auth/reset/confirm"
      glow
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      bodyClassName="p-6 sm:p-8"
    >
      <div className="mb-6 space-y-2">
        <span className="font-mono text-xs text-primary/80">~/reset/confirm</span>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-muted-foreground">$ </span>
          <span className="text-term-lime">fosslove</span>
          <span className="text-foreground"> passwd </span>
          <span className="text-term-cyan">--new</span>
          <span className="term-cursor" />
        </p>
      </div>
      {token ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs text-muted-foreground">
                    --password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs text-muted-foreground">
                    --confirm
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="glow-primary w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </Form>
      ) : (
        <p className="font-mono text-sm text-destructive">
          <span className="text-muted-foreground">! </span>
          token missing — request a new link from{" "}
          <Link href="/forgot-password" className="underline">
            ~/forgot-password
          </Link>
        </p>
      )}
    </Window>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
