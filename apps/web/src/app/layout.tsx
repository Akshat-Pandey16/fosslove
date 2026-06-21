import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
})

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "FOSSLove"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const defaultTitle = `${appName} — Install the open-source apps you love, in one script`
const defaultDescription =
  "Browse a curated catalog of free and open-source apps for Windows and Linux, then generate a ready-to-run install script for every package manager."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s · ${appName}`,
  },
  description: defaultDescription,
  keywords: [
    "foss",
    "open source",
    "winget",
    "flatpak",
    "apt",
    "install script",
    "linux",
    "windows",
  ],
  applicationName: appName,
  openGraph: {
    type: "website",
    siteName: appName,
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
