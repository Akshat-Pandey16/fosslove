"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/api/errors"
import { applyApiError } from "@/lib/api/form-errors"
import { useAuth } from "@/lib/auth/auth-provider"

const schema = z.object({
  full_name: z.string().max(200, "At most 200 characters").optional(),
  email: z.email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(128, "At most 128 characters")
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/\d/, "Include a number"),
})

type Values = z.infer<typeof schema>

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "" },
  })

  const onSubmit = async (values: Values) => {
    try {
      await register({
        email: values.email,
        password: values.password,
        full_name: values.full_name?.trim() || null,
      })
      toast.success("Account created")
      router.push("/account")
    } catch (error) {
      if (!applyApiError(error, form)) {
        toast.error(errorMessage(error))
      }
    }
  }

  return (
    <Window
      label="~/auth/register"
      glow
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      bodyClassName="p-6 sm:p-8"
    >
      <div className="mb-6 space-y-2">
        <span className="font-mono text-xs text-primary/80">~/register</span>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-muted-foreground">$ </span>
          <span className="text-term-lime">fosslove</span>
          <span className="text-foreground"> init </span>
          <span className="text-term-cyan">--account</span>
          <span className="term-cursor" />
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs text-muted-foreground">--name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Ada Lovelace"
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
                <FormDescription className="font-mono text-xs">
                  min 8 chars · ≥1 letter · ≥1 number
                </FormDescription>
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
            Create account
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
        already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          ~/login
        </Link>
      </p>
    </Window>
  )
}
