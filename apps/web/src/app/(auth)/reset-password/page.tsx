"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
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
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card p-8 shadow-sm duration-500">
      <div className="mb-6 space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>
      {token ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
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
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </Form>
      ) : (
        <p className="text-sm text-destructive">
          This reset link is missing its token. Request a new one from the{" "}
          <Link href="/forgot-password" className="font-medium underline">
            forgot password
          </Link>{" "}
          page.
        </p>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
