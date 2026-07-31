import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "./RequireAuth";
import { RootLayout } from "./RootLayout";
import { AccountPage } from "./pages/AccountPage";
import { AdminPage } from "./pages/AdminPage";
import { AppDetailPage } from "./pages/AppDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CollectionDetailPage } from "./pages/CollectionDetailPage";
import { MyCollectionsPage, PublicCollectionsPage } from "./pages/CollectionsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ScriptBuilderPage } from "./pages/ScriptBuilderPage";
import { ScriptHistoryPage } from "./pages/ScriptHistoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, element: <Navigate to="/apps" replace /> },
      { path: "apps", Component: CatalogPage },
      { path: "apps/:platform/:slug", Component: AppDetailPage },
      { path: "collections/public", Component: PublicCollectionsPage },
      { path: "collections/:id", Component: CollectionDetailPage },
      { path: "scripts", Component: ScriptBuilderPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
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
        children: [{ path: "admin", Component: AdminPage }],
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
