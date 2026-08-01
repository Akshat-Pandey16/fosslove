import { useState, type SyntheticEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { useAuth } from "@/auth/useAuth";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { Alert, ArrowRightIcon, Button, Field, Input, Terminal, TerminalLine } from "@/ui";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const state = location.state as { from?: string; notice?: string } | null;
  const from = state?.from ?? "/";

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await login(formString(form, "email"), formString(form, "password"));
      await navigate(from, { replace: true });
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="welcome back"
      title="Log in"
      description="Pick up your collections, favourites and script history exactly where you left them."
      aside={<LoginAside />}
      footer={
        <>
          <p>
            No account? <AuthLink to="/register">Sign up</AuthLink>
          </p>
          <p className="text-xs text-ink-faint">
            Never got the verification email?{" "}
            <AuthLink to="/resend-verification" className="text-xs">
              Send it again
            </AuthLink>
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {state?.notice !== undefined && <Alert tone="info">{state.notice}</Alert>}

        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </Field>
            <div className="flex justify-end">
              <AuthLink to="/forgot-password" className="text-xs">
                Forgot your password?
              </AuthLink>
            </div>
          </div>

          {error !== null && <Alert tone="danger">{error}</Alert>}

          <Button
            type="submit"
            size="lg"
            block
            loading={pending}
            iconEnd={pending ? undefined : <ArrowRightIcon size={18} />}
          >
            Log in
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

function LoginAside() {
  return (
    <div className="flex flex-col gap-7">
      <Terminal title="session">
        <TerminalLine>fosslove login</TerminalLine>
        <TerminalLine prompt="✓" muted>
          collections restored
        </TerminalLine>
        <TerminalLine prompt="✓" muted>
          favourites restored
        </TerminalLine>
        <TerminalLine prompt="✓" muted>
          script history restored
        </TerminalLine>
        <TerminalLine prompt="" muted>
          ready <span className="animate-caret">▌</span>
        </TerminalLine>
      </Terminal>

      <p className="max-w-[36ch] text-sm leading-relaxed text-ink-muted">
        Everything you saved follows you to the next machine — no export, no copy-paste.
      </p>
    </div>
  );
}
