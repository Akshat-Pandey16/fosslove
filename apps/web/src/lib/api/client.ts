import { tokenStore } from "@/lib/auth/tokens"
import { ApiError } from "./errors"
import { type RequestOptions, rawRequest, request } from "./http"
import type {
  AppCreatePayload,
  AppDetail,
  AppListItem,
  AppListParams,
  AppUpdatePayload,
  Category,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  ChangePasswordPayload,
  Collection,
  CollectionCreatePayload,
  CollectionDetail,
  CollectionUpdatePayload,
  LoginPayload,
  Message,
  Page,
  PageParams,
  RegisterPayload,
  ScriptGeneratePayload,
  ScriptRun,
  TokenPair,
  User,
  UserUpdatePayload,
} from "./types"

const isServer = typeof window === "undefined"

let refreshing: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const refresh = tokenStore.getRefresh()
  if (!refresh) {
    return false
  }
  try {
    const pair = await request<TokenPair>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refresh },
    })
    tokenStore.set(pair)
    return true
  } catch {
    tokenStore.clear()
    return false
  }
}

function runRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

async function authedRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (isServer) {
    return request<T>(path, opts)
  }
  const token = opts.token ?? tokenStore.getAccess()
  try {
    return await request<T>(path, { ...opts, token })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && tokenStore.getRefresh()) {
      if (await runRefresh()) {
        return request<T>(path, { ...opts, token: tokenStore.getAccess() })
      }
    }
    throw error
  }
}

export interface ScriptDownload {
  filename: string
  blob: Blob
}

async function generateScript(payload: ScriptGeneratePayload): Promise<ScriptDownload> {
  const attempt = (token: string | null) =>
    rawRequest("/scripts/generate", { method: "POST", body: payload, token })

  let res = await attempt(isServer ? null : tokenStore.getAccess())
  if (!isServer && res.status === 401 && tokenStore.getRefresh() && (await runRefresh())) {
    res = await attempt(tokenStore.getAccess())
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw ApiError.fromBody(res.status, data)
  }
  const blob = await res.blob()
  const disposition = res.headers.get("content-disposition") ?? ""
  const match = /filename="?([^"]+)"?/.exec(disposition)
  const fallback = payload.platform === "windows" ? "install_apps.ps1" : "install_apps.sh"
  return { filename: match?.[1] ?? fallback, blob }
}

export const api = {
  auth: {
    register: (data: RegisterPayload) =>
      request<User>("/auth/register", { method: "POST", body: data }),
    login: (data: LoginPayload) =>
      request<TokenPair>("/auth/login", { method: "POST", body: data }),
    logout: (refresh_token: string) =>
      request<Message>("/auth/logout", { method: "POST", body: { refresh_token } }),
    verifyEmail: (token: string) =>
      request<Message>("/auth/verify-email", { method: "POST", body: { token } }),
    resendVerification: (email: string) =>
      request<Message>("/auth/resend-verification", { method: "POST", body: { email } }),
    requestPasswordReset: (email: string) =>
      request<Message>("/auth/password-reset", { method: "POST", body: { email } }),
    confirmPasswordReset: (token: string, new_password: string) =>
      request<Message>("/auth/password-reset/confirm", {
        method: "POST",
        body: { token, new_password },
      }),
  },
  users: {
    me: (opts?: RequestOptions) => authedRequest<User>("/users/me", opts),
    update: (data: UserUpdatePayload) =>
      authedRequest<User>("/users/me", { method: "PATCH", body: data }),
    changePassword: (data: ChangePasswordPayload) =>
      authedRequest<Message>("/users/me/change-password", { method: "POST", body: data }),
    remove: () => authedRequest<Message>("/users/me", { method: "DELETE" }),
  },
  catalog: {
    listCategories: (params?: PageParams, opts?: RequestOptions) =>
      authedRequest<Page<Category>>("/categories", { ...opts, query: { ...params } }),
    getCategory: (id: number, opts?: RequestOptions) =>
      authedRequest<Category>(`/categories/${id}`, opts),
    listApps: (params?: AppListParams, opts?: RequestOptions) =>
      authedRequest<Page<AppListItem>>("/apps", { ...opts, query: { ...params } }),
    getApp: (id: number, opts?: RequestOptions) => authedRequest<AppDetail>(`/apps/${id}`, opts),
  },
  collections: {
    listMine: (params?: PageParams) =>
      authedRequest<Page<Collection>>("/collections", { query: { ...params } }),
    listPublic: (params?: PageParams, opts?: RequestOptions) =>
      authedRequest<Page<Collection>>("/collections/public", { ...opts, query: { ...params } }),
    create: (data: CollectionCreatePayload) =>
      authedRequest<CollectionDetail>("/collections", { method: "POST", body: data }),
    get: (id: number, opts?: RequestOptions) =>
      authedRequest<CollectionDetail>(`/collections/${id}`, opts),
    update: (id: number, data: CollectionUpdatePayload) =>
      authedRequest<CollectionDetail>(`/collections/${id}`, { method: "PATCH", body: data }),
    setApps: (id: number, app_ids: number[]) =>
      authedRequest<CollectionDetail>(`/collections/${id}/apps`, {
        method: "PATCH",
        body: { app_ids },
      }),
    remove: (id: number) => authedRequest<Message>(`/collections/${id}`, { method: "DELETE" }),
  },
  favorites: {
    list: (params?: PageParams) =>
      authedRequest<Page<AppListItem>>("/favorites", { query: { ...params } }),
    add: (appId: number) => authedRequest<Message>(`/favorites/${appId}`, { method: "PATCH" }),
    remove: (appId: number) => authedRequest<Message>(`/favorites/${appId}`, { method: "DELETE" }),
  },
  scripts: {
    history: (params?: PageParams) =>
      authedRequest<Page<ScriptRun>>("/scripts/history", { query: { ...params } }),
    generate: generateScript,
  },
  admin: {
    createCategory: (data: CategoryCreatePayload) =>
      authedRequest<Category>("/admin/categories", { method: "POST", body: data }),
    updateCategory: (id: number, data: CategoryUpdatePayload) =>
      authedRequest<Category>(`/admin/categories/${id}`, { method: "PATCH", body: data }),
    deleteCategory: (id: number) =>
      authedRequest<Message>(`/admin/categories/${id}`, { method: "DELETE" }),
    createApp: (data: AppCreatePayload) =>
      authedRequest<AppDetail>("/admin/apps", { method: "POST", body: data }),
    updateApp: (id: number, data: AppUpdatePayload) =>
      authedRequest<AppDetail>(`/admin/apps/${id}`, { method: "PATCH", body: data }),
    deleteApp: (id: number) => authedRequest<Message>(`/admin/apps/${id}`, { method: "DELETE" }),
    recomputeCounts: () => authedRequest<Message>("/admin/recompute-counts", { method: "POST" }),
    cleanupTokens: () =>
      authedRequest<Record<string, number>>("/admin/cleanup-tokens", { method: "POST" }),
  },
}
