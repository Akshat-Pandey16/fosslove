import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "./RequireAuth";
import { RouteError } from "./RouteError";
import { RootLayout } from "./RootLayout";
import { AccountPage } from "./pages/AccountPage";
import { AdminAppsPage } from "./pages/AdminAppsPage";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AppDetailPage } from "./pages/AppDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CategoryPage } from "./pages/CategoryPage";
import { CollectionDetailPage } from "./pages/CollectionDetailPage";
import { MyCollectionsPage, PublicCollectionsPage } from "./pages/CollectionsPage";
import { ConfirmEmailChangePage } from "./pages/ConfirmEmailChangePage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResendVerificationPage } from "./pages/ResendVerificationPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ScriptBuilderPage } from "./pages/ScriptBuilderPage";
import { ScriptHistoryPage } from "./pages/ScriptHistoryPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <Navigate to="/apps" replace /> },

      { path: "apps", Component: CatalogPage },
      { path: "apps/:platform/:slug", Component: AppDetailPage },
      { path: "categories/:slug", Component: CategoryPage },
      { path: "collections/public", Component: PublicCollectionsPage },
      { path: "collections/:id", Component: CollectionDetailPage },
      { path: "scripts", Component: ScriptBuilderPage },

      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "verify-email", Component: VerifyEmailPage },
      { path: "resend-verification", Component: ResendVerificationPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
      { path: "confirm-email-change", Component: ConfirmEmailChangePage },

      {
        Component: RequireAuth,
        children: [
          { path: "account", Component: AccountPage },
          { path: "favorites", Component: FavoritesPage },
          { path: "collections", Component: MyCollectionsPage },
          { path: "scripts/history", Component: ScriptHistoryPage },
        ],
      },
      {
        element: <RequireAuth admin />,
        children: [
          { path: "admin", Component: AdminPage },
          { path: "admin/apps", Component: AdminAppsPage },
          { path: "admin/categories", Component: AdminCategoriesPage },
          { path: "admin/settings", Component: AdminSettingsPage },
        ],
      },

      { path: "*", Component: NotFoundPage },
    ],
  },
]);
