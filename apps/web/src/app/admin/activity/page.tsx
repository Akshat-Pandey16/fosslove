"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SectionHeading } from "@/components/deck/section-heading"
import { Window } from "@/components/deck/window"
import { Reveal } from "@/components/motion/reveal"
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
      <SectionHeading
        tag="~/admin/activity"
        title="Audit log"
        description="Admin and auth events, newest first. Filter by action, status, or target."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={action}
          onChange={(event) => {
            setAction(event.target.value)
            setPage(1)
          }}
          placeholder="login, app.create…"
          className="max-w-56 font-mono"
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(value) => {
            setStatus(String(value))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40 font-mono">
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
          className="max-w-56 font-mono"
        />
      </div>

      <Reveal>
        <Window label="~/admin/activity/audit.log" bodyClassName="p-0">
          <Table className="font-mono text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  time
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  action
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  status
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  user
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  target
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  ip
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    loading…
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-destructive">
                    ! failed to load activity — please retry
                  </TableCell>
                </TableRow>
              ) : data && data.items.length > 0 ? (
                data.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-term-cyan">{log.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === "failure" ? "destructive" : "outline"}
                        className={
                          log.status === "failure"
                            ? "font-mono"
                            : "border-term-amber/30 font-mono text-term-amber"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userLabel(log.user_id)}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">
                      {targetLabel(log)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.client_ip ?? "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    no activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Window>
      </Reveal>

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
