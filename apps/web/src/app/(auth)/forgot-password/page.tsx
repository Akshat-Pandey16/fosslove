"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
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
    <Window
      label="~/auth/reset"
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      bodyClassName="p-6 sm:p-8"
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-10 text-term-amber" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="font-mono text-sm text-term-lime">
            $ mail sent — if that account exists, a reset link is on its way.
          </p>
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/login">Back to sign in</Link>}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-2">
            <span className="font-mono text-xs text-primary/80">~/reset</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="font-mono text-sm text-muted-foreground">
              <span className="text-muted-foreground">$ </span>
              <span className="text-term-lime">fosslove</span>
              <span className="text-foreground"> reset </span>
              <span className="text-term-cyan">--request</span>
              <span className="term-cursor" />
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground">
                      --email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
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
                Send reset link
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              ~/login
            </Link>
          </p>
        </>
      )}
    </Window>
  )
}
