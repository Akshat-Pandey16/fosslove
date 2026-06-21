import { BuilderBar } from "@/components/builder/builder-bar"
import { BootIntro } from "@/components/shell/boot-intro"
import { DeckDock } from "@/components/shell/deck-dock"
import { DockRail } from "@/components/shell/dock-rail"
import { KeyboardLayer } from "@/components/shell/keyboard-layer"
import { StatusBar } from "@/components/shell/status-bar"
import { TopBar } from "@/components/shell/top-bar"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-14 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
      >
        Skip to content
      </a>
      <BootIntro />
      <KeyboardLayer />
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <DockRail />
        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
        <DeckDock />
      </div>
      <StatusBar />
      <BuilderBar />
    </div>
  )
}
