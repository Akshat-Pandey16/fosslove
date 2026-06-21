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
import { errorMessage } from "@/lib/api/errors"
import { useAuth } from "@/lib/auth/auth-provider"

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
})

type Values = z.infer<typeof schema>

function safeNext(raw: string | null): string {
  return raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/account"
}

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get("next"))

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: Values) => {
    try {
      await login(values)
      toast.success("Welcome back")
      router.push(next)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Window
      label="~/auth/login"
      glow
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      bodyClassName="p-6 sm:p-8"
    >
      <div className="mb-6 space-y-2">
        <span className="font-mono text-xs text-primary/80">~/auth</span>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-muted-foreground">$ </span>
          <span className="text-term-lime">fosslove</span>
          <span className="text-foreground"> login</span>
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
                <FormLabel className="font-mono text-xs text-muted-foreground">--email</FormLabel>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-mono text-xs text-muted-foreground">
                    --password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    forgot?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
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
            Sign in
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
        no account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          ~/register
        </Link>
      </p>
    </Window>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
