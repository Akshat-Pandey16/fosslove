import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "@/auth/useAuth";

export function RootLayout() {
  const { isAuthenticated, isVerified, isAdmin, user, logout } = useAuth();

  return (
    <>
      <header>
        <Link to="/">FOSSLove</Link>
        <nav>
          <NavLink to="/apps">Catalog</NavLink>
          <NavLink to="/collections/public">Public collections</NavLink>
          <NavLink to="/scripts">Script builder</NavLink>
          {isAuthenticated && <NavLink to="/favorites">Favorites</NavLink>}
          {isAuthenticated && <NavLink to="/collections">My collections</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div>
          {isAuthenticated ? (
            <>
              <Link to="/account">{user?.email}</Link>
              <button type="button" onClick={() => void logout()}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </div>
      </header>

      {isAuthenticated && !isVerified && (
        <p role="status">
          Your email address is not verified yet.{" "}
          <Link to="/resend-verification">Resend the verification email</Link>.
        </p>
      )}

      <main>
        <Outlet />
      </main>

      <footer>
        <p>Free and open-source apps for Windows and Linux.</p>
      </footer>
    </>
  );
}
