import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import { isApiError } from "@/api/errors";
import { formString } from "@/lib/form";
import { useAuth } from "@/auth/useAuth";

export function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = formString(form, "email");
    const password = formString(form, "password");
    const fullName = formString(form, "full_name");

    setPending(true);
    setError(null);
    try {
      await register({ email, password, ...(fullName === "" ? {} : { full_name: fullName }) });
      await login(email, password);
      await navigate("/", { replace: true });
    } catch (caught) {
      setError(
        isApiError(caught)
          ? (caught.firstFieldError() ?? caught.message)
          : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <section>
      <h1>Create an account</h1>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="full_name">Name</label>
        <input id="full_name" name="full_name" type="text" autoComplete="name" />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />

        {error !== null && <p role="alert">{error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
