export type Platform = "windows" | "linux"

export type PackageManager =
  | "winget"
  | "msstore"
  | "apt"
  | "dnf"
  | "pacman"
  | "flatpak"
  | "snap"
  | "direct"

export type UserRole = "user" | "admin"

export interface PageMeta {
  page: number
  size: number
  total: number
  pages: number
}

export interface Page<T> {
  items: T[]
  meta: PageMeta
}

export interface Message {
  message: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  windows_app_count: number
  linux_app_count: number
  created_at: string
}

export interface PackageReference {
  id: number
  manager: PackageManager
  identifier: string
  install_args: string | null
  priority: number
  extra: Record<string, unknown> | null
}

export interface AppListItem {
  id: number
  category_id: number
  category_name: string
  platform: Platform
  name: string
  slug: string
  summary: string | null
  homepage_url: string | null
  is_active: boolean
}

export interface AppDetail extends AppListItem {
  description: string | null
  license: string | null
  package_refs: PackageReference[]
  created_at: string
  updated_at: string
}

export interface Collection {
  id: number
  user_id: string
  name: string
  slug: string
  description: string | null
  is_public: boolean
  item_count: number
  created_at: string
  updated_at: string
}

export interface CollectionItem {
  app: AppListItem
  position: number
}

export interface CollectionDetail extends Collection {
  items: CollectionItem[]
}

export interface ScriptRun {
  id: number
  platform: Platform
  app_count: number
  app_ids: number[]
  created_at: string
}

export interface RegisterPayload {
  email: string
  password: string
  full_name?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface UserUpdatePayload {
  full_name?: string | null
}

export interface CategoryCreatePayload {
  name: string
  description?: string | null
  icon_url?: string | null
}

export interface CategoryUpdatePayload {
  name?: string | null
  description?: string | null
  icon_url?: string | null
}

export interface PackageReferencePayload {
  manager: PackageManager
  identifier: string
  install_args?: string | null
  priority?: number
  extra?: Record<string, unknown> | null
}

export interface AppCreatePayload {
  category_id: number
  platform: Platform
  name: string
  summary?: string | null
  description?: string | null
  homepage_url?: string | null
  license?: string | null
  package_refs?: PackageReferencePayload[]
}

export interface AppUpdatePayload {
  category_id?: number | null
  name?: string | null
  summary?: string | null
  description?: string | null
  homepage_url?: string | null
  license?: string | null
  is_active?: boolean | null
  package_refs?: PackageReferencePayload[]
}

export interface CollectionCreatePayload {
  name: string
  description?: string | null
  is_public?: boolean
  app_ids?: number[]
}

export interface CollectionUpdatePayload {
  name?: string | null
  description?: string | null
  is_public?: boolean | null
}

export interface ScriptGeneratePayload {
  platform: Platform
  app_ids?: number[]
  collection_id?: number | null
}

export interface RuntimeSettings {
  registration_enabled: boolean
  email_enabled: boolean
  rate_limit_enabled: boolean
  rate_limit_default: string
  rate_limit_auth: string
  email_backend: "console" | "smtp"
  email_from: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password_set: boolean
  smtp_use_tls: boolean
  project_name: string
  frontend_base_url: string
}

export interface RuntimeSettingsUpdate {
  registration_enabled?: boolean
  email_enabled?: boolean
  rate_limit_enabled?: boolean
  rate_limit_default?: string
  rate_limit_auth?: string
  email_backend?: "console" | "smtp"
  email_from?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  smtp_use_tls?: boolean
  project_name?: string
  frontend_base_url?: string
}

export interface AppListParams {
  page?: number
  size?: number
  platform?: Platform | null
  category_id?: number | null
  q?: string | null
}

export interface PageParams {
  page?: number
  size?: number
}
