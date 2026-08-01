import type { components } from "./schema";

type Schemas = components["schemas"];

export type App = Schemas["AppList"];
export type AppDetail = Schemas["AppDetail"];
export type Category = Schemas["Category"];
export type PackageReference = Schemas["PackageReference"];
export type Platform = Schemas["PlatformEnum"];
export type Collection = Schemas["Collection"];
export type CollectionDetail = Schemas["CollectionDetail"];
export type ScriptRun = Schemas["ScriptRun"];
export type User = Schemas["User"];
export type Session = Schemas["Session"];
export type ActivityLog = Schemas["ActivityLog"];
export type DataExport = Schemas["DataExport"];
export type CatalogExport = Schemas["CatalogExport"];
export type SiteConfiguration = Schemas["SiteConfigurationRead"];
export type PageMeta = Schemas["PageMeta"];

export interface Paginated<TItem> {
  items: TItem[];
  meta: PageMeta;
}

export const PLATFORMS = ["windows", "linux"] as const satisfies readonly Platform[];

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}
