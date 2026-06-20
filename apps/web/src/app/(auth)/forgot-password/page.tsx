"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
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

const schema = z.object({ email: z.email("Enter a valid email") })
type Values = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } })

  const onSubmit = async (values: Values) => {
    await api.auth.requestPasswordReset(values.email).catch(() => undefined)
    setSent(true)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card p-8 shadow-sm duration-500">
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we've sent a link to reset your password.
          </p>
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/login">Back to sign in</Link>}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                Send reset link
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
