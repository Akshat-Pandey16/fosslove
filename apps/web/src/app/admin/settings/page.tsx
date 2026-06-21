"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { RuntimeSettings, RuntimeSettingsUpdate } from "@/lib/api/types"

export default function AdminSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.admin.getSettings(),
  })

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure the platform at runtime. Secrets, the database, and CORS stay in environment
          variables.
        </p>
      </header>
      {isLoading || !data ? (
        <Skeleton className="h-[480px] rounded-xl" />
      ) : (
        <SettingsForm settings={data} />
      )}
    </div>
  )
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isRateLimitSpec(value: string): boolean {
  return /^\d+\s*(\/|\s+per\s+)\s*(second|minute|hour|day|month|year)s?$/i.test(value.trim())
}

function SettingsForm({ settings }: { settings: RuntimeSettings }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<RuntimeSettings>(settings)
  const [smtpPassword, setSmtpPassword] = useState("")

  const set = <K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const mutation = useMutation({
    mutationFn: (payload: RuntimeSettingsUpdate) => api.admin.updateSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "settings"], updated)
      setForm(updated)
      setSmtpPassword("")
      toast.success("Settings saved")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const save = () => {
    const updates: RuntimeSettingsUpdate = {}
    const keys: (keyof RuntimeSettings)[] = [
      "registration_enabled",
      "email_enabled",
      "rate_limit_enabled",
      "rate_limit_default",
      "rate_limit_auth",
      "email_backend",
      "email_from",
      "smtp_host",
      "smtp_port",
      "smtp_user",
      "smtp_use_tls",
      "project_name",
      "frontend_base_url",
    ]
    for (const key of keys) {
      if (form[key] !== settings[key]) {
        Object.assign(updates, { [key]: form[key] })
      }
    }
    if (smtpPassword.trim()) {
      updates.smtp_password = smtpPassword.trim()
    }
    if (Object.keys(updates).length === 0) {
      toast.message("Nothing to save")
      return
    }
    const url = form.frontend_base_url.trim()
    if (!isHttpUrl(url) || url.length > 500) {
      toast.error("Frontend URL must be a valid http(s) URL")
      return
    }
    if (!isRateLimitSpec(form.rate_limit_default) || !isRateLimitSpec(form.rate_limit_auth)) {
      toast.error("Rate limits must look like 200/minute")
      return
    }
    mutation.mutate(updates)
  }

  return (
    <div className="space-y-6">
      <Section title="Feature flags" description="Toggle product features without a redeploy.">
        <Toggle
          label="User registration"
          description="Allow new accounts to be created."
          checked={form.registration_enabled}
          onChange={(value) => set("registration_enabled", value)}
        />
        <Toggle
          label="Email verification"
          description="Require email verification (off = new users auto-verified)."
          checked={form.email_enabled}
          onChange={(value) => set("email_enabled", value)}
        />
      </Section>

      <Section title="Rate limiting" description="Protect the API from abuse.">
        <Toggle
          label="Enabled"
          description="Master switch for request rate limiting."
          checked={form.rate_limit_enabled}
          onChange={(value) => set("rate_limit_enabled", value)}
        />
        <Field label="Global limit">
          <Input
            value={form.rate_limit_default}
            onChange={(event) => set("rate_limit_default", event.target.value)}
            placeholder="200/minute"
            className="font-mono"
          />
        </Field>
        <Field label="Auth limit">
          <Input
            value={form.rate_limit_auth}
            onChange={(event) => set("rate_limit_auth", event.target.value)}
            placeholder="10/minute"
            className="font-mono"
          />
        </Field>
      </Section>

      <Section
        title="Email & SMTP"
        description="Outgoing email for verification and password reset."
      >
        <Field label="Backend">
          <Select
            items={{ console: "Console (log only)", smtp: "SMTP" }}
            value={form.email_backend}
            onValueChange={(value) => set("email_backend", value === "smtp" ? "smtp" : "console")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="console">Console (log only)</SelectItem>
              <SelectItem value="smtp">SMTP</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="From address">
          <Input
            value={form.email_from}
            onChange={(event) => set("email_from", event.target.value)}
            placeholder="no-reply@example.com"
          />
        </Field>
        <Field label="SMTP host">
          <Input
            value={form.smtp_host}
            onChange={(event) => set("smtp_host", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SMTP port">
            <Input
              type="number"
              value={form.smtp_port}
              onChange={(event) => set("smtp_port", Number(event.target.value) || 0)}
            />
          </Field>
          <Field label="SMTP user">
            <Input
              value={form.smtp_user}
              onChange={(event) => set("smtp_user", event.target.value)}
            />
          </Field>
        </div>
        <Field label="SMTP password">
          <Input
            type="password"
            value={smtpPassword}
            onChange={(event) => setSmtpPassword(event.target.value)}
            placeholder={settings.smtp_password_set ? "•••••••• (leave blank to keep)" : "Not set"}
          />
        </Field>
        <Toggle
          label="Use TLS"
          description="STARTTLS for the SMTP connection."
          checked={form.smtp_use_tls}
          onChange={(value) => set("smtp_use_tls", value)}
        />
      </Section>

      <Section title="Branding" description="Names and URLs used across the app and emails.">
        <Field label="Project name">
          <Input
            value={form.project_name}
            onChange={(event) => set("project_name", event.target.value)}
          />
        </Field>
        <Field label="Frontend base URL">
          <Input
            value={form.frontend_base_url}
            onChange={(event) => set("frontend_base_url", event.target.value)}
            placeholder="https://app.example.com"
            className="font-mono"
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={mutation.isPending} className="glow-primary">
          {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
          Save settings
        </Button>
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
