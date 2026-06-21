"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Monitor } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { SectionHeading } from "@/components/deck/section-heading"
import { Window } from "@/components/deck/window"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { queryKeys } from "@/lib/api/query-keys"
import { useAuth } from "@/lib/auth/auth-provider"
import { formatDate } from "@/lib/constants"
import { downloadBlob } from "@/lib/download"

const profileSchema = z.object({ full_name: z.string().max(200) })
const emailSchema = z.object({ new_email: z.email("Enter a valid email") })
const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    new_password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((data) => data.new_password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl space-y-8">
      <SectionHeading
        tag="~/account/settings"
        title="Settings"
        description="Manage your profile and account security."
      />
      <ProfileSection fullName={user?.full_name ?? ""} email={user?.email ?? ""} />
      <EmailSection email={user?.email ?? ""} />
      <PasswordSection />
      <SessionsSection />
      <ExportSection />
      <DangerSection />
    </div>
  )
}

function ProfileSection({ fullName, email }: { fullName: string; email: string }) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: fullName },
  })

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      await api.users.update({ full_name: values.full_name.trim() || null })
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      toast.success("Profile updated")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Window label="~/account/profile" bodyClassName="space-y-4 p-6">
      <h2 className="font-heading text-lg font-semibold">Profile</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel className="font-mono">Email</FormLabel>
            <Input value={email} disabled readOnly />
          </FormItem>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono">Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </Form>
    </Window>
  )
}

function EmailSection({ email }: { email: string }) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { new_email: "" },
  })

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    try {
      const { message } = await api.users.requestEmailChange(values.new_email)
      toast.success(message)
      form.reset()
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
    } catch (error) {
      if (!applyApiError(error, form)) {
        toast.error(errorMessage(error))
      }
    }
  }

  return (
    <Window label="~/account/email" bodyClassName="space-y-4 p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">Email address</h2>
        <p className="text-sm text-muted-foreground">
          Currently <span className="font-mono text-foreground">{email}</span>. We may send a
          confirmation link to the new address.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="new_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono">New email</FormLabel>
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Update email
          </Button>
        </form>
      </Form>
    </Window>
  )
}

function PasswordSection() {
  const { logout } = useAuth()
  const router = useRouter()
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  })

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      await api.users.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      toast.success("Password changed. Please sign in again.")
      await logout()
      router.push("/login")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Window label="~/account/password" bodyClassName="space-y-4 p-6">
      <h2 className="font-heading text-lg font-semibold">Change password</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono">Current password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono">New password</FormLabel>
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
                <FormLabel className="font-mono">Confirm new password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </Form>
    </Window>
  )
}

function SessionsSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => api.users.listSessions(),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.users.revokeSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      toast.success("Session revoked")
    },
    onError: (error) => {
      toast.error(errorMessage(error))
    },
  })

  return (
    <Window label="~/account/sessions" bodyClassName="space-y-4 p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">Active sessions</h2>
        <p className="text-sm text-muted-foreground">
          Devices currently signed in to your account.
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          loading sessions…
        </div>
      ) : !data || data.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">$ no active sessions</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-background/40">
          {data.map((session) => (
            <li
              key={session.id}
              className="flex items-start justify-between gap-4 p-4 transition-colors hover:bg-secondary/30"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden className="mt-0.5 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-term-lime" />
                  <Monitor className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="truncate font-medium">{session.user_agent ?? "Unknown device"}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    ip {session.client_ip ?? "—"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    in {formatDate(session.created_at)} · used{" "}
                    {session.last_used_at ? formatDate(session.last_used_at) : "—"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => revoke.mutate(session.id)}
                disabled={revoke.isPending}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Window>
  )
}

function ExportSection() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await api.users.exportData()
      downloadBlob(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        "fosslove-data.json",
      )
      toast.success("Data exported")
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Window label="~/account/export" bodyClassName="space-y-4 p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">Export your data</h2>
        <p className="text-sm text-muted-foreground">
          Download a JSON file of your profile, collections, favorites, and script history.
        </p>
      </div>
      <Button variant="outline" onClick={handleExport} disabled={exporting}>
        {exporting ? <Loader2 className="animate-spin" /> : null}
        Download my data
      </Button>
    </Window>
  )
}

function DangerSection() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleDelete = async () => {
    try {
      await api.users.remove()
      await logout()
      toast.success("Account deleted")
      router.push("/")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Window
      label="~/account/danger"
      bodyClassName="space-y-4 p-6"
      className="border-destructive/40 bg-destructive/5"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account, collections, favorites, and history.
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive">Delete account</Button>} />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All your data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Window>
  )
}
