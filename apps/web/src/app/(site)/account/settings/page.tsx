"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
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
import { useAuth } from "@/lib/auth/auth-provider"

const profileSchema = z.object({ full_name: z.string().max(200) })
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
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account security.</p>
      </header>
      <ProfileSection fullName={user?.full_name ?? ""} email={user?.email ?? ""} />
      <PasswordSection />
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
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold">Profile</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <Input value={email} disabled readOnly />
          </FormItem>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
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
    </section>
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
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold">Change password</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
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
                <FormLabel>Confirm new password</FormLabel>
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
    </section>
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
    <section className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
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
    </section>
  )
}
