export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: NavLink[] = [
  { href: "/apps", label: "Apps" },
  { href: "/categories", label: "Categories" },
  { href: "/collections", label: "Collections" },
  { href: "/builder", label: "Builder" },
]
