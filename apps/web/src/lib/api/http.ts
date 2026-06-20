import { ApiError } from "./errors"

const isServer = typeof window === "undefined"

const FALLBACK_BASE = "http://localhost:8001/api/v1"

export function apiBaseUrl(): string {
  if (isServer) {
    return process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? FALLBACK_BASE
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? FALLBACK_BASE
}

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, QueryValue>
  token?: string | null
  signal?: AbortSignal
  cache?: RequestCache
  next?: { revalidate?: number | false; tags?: string[] }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${apiBaseUrl()}${path}`
  if (!query) {
    return url
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export async function rawRequest(path: string, opts: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {}
  let body: BodyInit | undefined
  if (opts.body !== undefined) {
    headers["content-type"] = "application/json"
    body = JSON.stringify(opts.body)
  }
  if (opts.token) {
    headers.authorization = `Bearer ${opts.token}`
  }
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
    cache: opts.cache,
    next: opts.next,
  })
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, opts)
  if (res.status === 204) {
    return undefined as T
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw ApiError.fromBody(res.status, data)
  }
  return data as T
}
