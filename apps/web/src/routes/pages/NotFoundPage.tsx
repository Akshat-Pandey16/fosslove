import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>
        That page does not exist. <Link to="/">Back to the catalog</Link>
      </p>
    </section>
  );
}
