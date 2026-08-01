import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { isApiError } from "@/api/errors";

export function RouteError() {
  const error = useRouteError();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : isApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  return (
    <section>
      <h1>Something went wrong</h1>
      <p role="alert">{detail}</p>
      <p>
        <Link to="/apps">Back to the catalog</Link>
      </p>
    </section>
  );
}
