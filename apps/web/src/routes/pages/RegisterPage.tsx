import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { useAuth } from "@/auth/useAuth";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { Alert, ArrowRightIcon, Button, Field, Input, Terminal, TerminalLine } from "@/ui";

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
      setError(messageFor(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="join fosslove"
      title="Create an account"
      description="Free, and only an email is required. An account saves your collections, favourites and generated scripts."
      aside={<RegisterAside />}
      footer={
        <p>
          Already registered? <AuthLink to="/login">Log in</AuthLink>
        </p>
      }
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
        <Field label="Name" htmlFor="full_name" hint="Optional — used to greet you.">
          <Input id="full_name" name="full_name" type="text" autoComplete="name" placeholder="Ada Lovelace" />
        </Field>

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

        <Field
          label="Password"
          htmlFor="password"
          hint="Pick something long and unique — a passphrase works well."
          required
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
          />
        </Field>

        {error !== null && <Alert tone="danger">{error}</Alert>}

        <Button
          type="submit"
          size="lg"
          block
          loading={pending}
          iconEnd={pending ? undefined : <ArrowRightIcon size={18} />}
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

function RegisterAside() {
  return (
    <div className="flex flex-col gap-7">
      <Terminal title="install_apps.sh">
        <TerminalLine>fosslove new-setup</TerminalLine>
        <TerminalLine prompt="→" muted>
          pick your apps
        </TerminalLine>
        <TerminalLine prompt="→" muted>
          choose windows or linux
        </TerminalLine>
        <TerminalLine prompt="→" muted>
          run one script
        </TerminalLine>
        <TerminalLine prompt="" muted>
          done <span className="animate-caret">▌</span>
        </TerminalLine>
      </Terminal>

      <p className="max-w-[36ch] text-sm leading-relaxed text-ink-muted">
        Save your picks once, then rebuild any machine from a single script.
      </p>
    </div>
  );
}
