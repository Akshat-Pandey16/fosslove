import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { AuthLayout, AuthLink, AuthSuccess } from "@/components/AuthLayout";
import { useConfirmEmailChange } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { Alert, LinkButton, Spinner } from "@/ui";

export function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const confirm = useConfirmEmailChange();
  const { mutate } = confirm;
  const started = useRef(false);

  useEffect(() => {
    if (started.current || token === "") return;
    started.current = true;
    mutate({ token });
  }, [mutate, token]);

  const incomplete = token === "";
  const busy = !incomplete && !confirm.isSuccess && !confirm.isError;

  return (
    <AuthLayout
      eyebrow="email change"
      title="Confirm your new email address"
      description={busy ? "Confirming the link you opened from your new inbox." : undefined}
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      {incomplete && (
        <div className="flex flex-col gap-5">
          <Alert tone="danger" title="This link is missing its confirmation code">
            Open the link straight from your email, or start the change again from your account.
          </Alert>
          <LinkButton to="/account" variant="secondary" size="lg" block>
            Request a new link
          </LinkButton>
        </div>
      )}

      {busy && (
        <div className="flex flex-col items-center gap-4 py-6" aria-busy="true">
          <Spinner size="lg" className="text-ember" />
          <p
            role="status"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-muted"
          >
            Confirming
          </p>
        </div>
      )}

      {confirm.isSuccess && (
        <AuthSuccess
          title="Email address updated"
          message={confirm.data.message}
          action={<LinkButton to="/login">Log in with your new address</LinkButton>}
        />
      )}

      {confirm.isError && (
        <div className="flex flex-col gap-5">
          <Alert tone="danger" title="We could not confirm this address">
            {messageFor(confirm.error)}
          </Alert>
          <LinkButton to="/account" variant="secondary" size="lg" block>
            Request a new link
          </LinkButton>
        </div>
      )}
    </AuthLayout>
  );
}
