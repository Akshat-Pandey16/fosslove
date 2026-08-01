import { Outlet } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VerificationBanner } from "@/components/VerificationBanner";
import { PageTransition } from "@/ui";

export function RootLayout() {
  const { isAuthenticated, isVerified } = useAuth();

  return (
    <div className="grain flex min-h-dvh flex-col bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:h-11 focus:items-center focus:rounded-full focus:bg-ember focus:px-5 focus:text-sm focus:font-medium focus:text-white focus:shadow-lift"
      >
        Skip to content
      </a>

      <SiteHeader />

      {isAuthenticated && !isVerified && <VerificationBanner />}

      <main id="main" className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <SiteFooter />
    </div>
  );
}
