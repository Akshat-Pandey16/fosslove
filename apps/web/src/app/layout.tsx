import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
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

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "FOSSLove"

export const metadata: Metadata = {
  title: {
    default: `${appName} — Install the open-source apps you love, in one script`,
    template: `%s · ${appName}`,
  },
  description:
    "Browse a curated catalog of free and open-source apps for Windows and Linux, then generate a ready-to-run install script for every package manager.",
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
