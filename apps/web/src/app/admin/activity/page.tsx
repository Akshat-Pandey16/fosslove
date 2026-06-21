"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/query-keys"
import type { ActivityLog } from "@/lib/api/types"

const STATUS_ITEMS: Record<string, string> = {
  "": "Any status",
  ok: "ok",
  failure: "failure",
}

function userLabel(userId: string | null): string {
  return userId ? `${userId.slice(0, 8)}…` : "—"
}

function targetLabel(log: ActivityLog): string {
  if (!log.target_type && !log.target_id) {
    return "—"
  }
  return [log.target_type, log.target_id].filter(Boolean).join("/")
}

export default function AdminActivityPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState("")
  const [status, setStatus] = useState("")
  const [targetType, setTargetType] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.activity({ page, size: 20, action, status, target_type: targetType }),
    queryFn: () =>
      api.admin.listActivity({
        page,
        size: 20,
        action: action || null,
        status: status || null,
        target_type: targetType || null,
      }),
    placeholderData: keepPreviousData,
  })
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Activity log</h1>
        <p className="text-muted-foreground">
          Admin and auth events, newest first. Filter by action, status, or target.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={action}
          onChange={(event) => {
            setAction(event.target.value)
            setPage(1)
          }}
          placeholder="login, app.create…"
          className="max-w-56"
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(value) => {
            setStatus(String(value))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value)
            setPage(1)
          }}
          placeholder="Target type"
          className="max-w-56"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  Failed to load activity. Please retry.
                </TableCell>
              </TableRow>
            ) : data && data.items.length > 0 ? (
              data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "failure" ? "destructive" : "secondary"}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {userLabel(log.user_id)}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {targetLabel(log)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.client_ip ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.pages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Prev
          </Button>
          <span className="font-mono text-sm text-muted-foreground">
            {page} / {meta.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
