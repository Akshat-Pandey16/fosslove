import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { AuthLayout, AuthLink, AuthSuccess } from "@/components/AuthLayout";
import { useVerifyEmail } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { Alert, LinkButton, Spinner } from "@/ui";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const verify = useVerifyEmail();
  const { mutate } = verify;
  const started = useRef(false);

  useEffect(() => {
    if (started.current || uid === "" || token === "") return;
    started.current = true;
    mutate({ uid, token });
  }, [mutate, uid, token]);

  const incomplete = uid === "" || token === "";
  const busy = !incomplete && !verify.isSuccess && !verify.isError;

  return (
    <AuthLayout
      eyebrow="email verification"
      title="Verify your email"
      description={busy ? "Confirming the link you opened from your inbox." : undefined}
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      {incomplete && (
        <div className="flex flex-col gap-5">
          <Alert tone="danger" title="This link is missing its verification code">
            Open the link straight from your email, or ask us to send a new one.
          </Alert>
          <LinkButton to="/resend-verification" variant="secondary" size="lg" block>
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
            Verifying
          </p>
        </div>
      )}

      {verify.isSuccess && (
        <AuthSuccess
          title="You're verified"
          message={verify.data.message}
          action={<LinkButton to="/login">Continue to log in</LinkButton>}
        />
      )}

      {verify.isError && (
        <div className="flex flex-col gap-5">
          <Alert tone="danger" title="We could not verify this link">
            {messageFor(verify.error)}
          </Alert>
          <LinkButton to="/resend-verification" variant="secondary" size="lg" block>
            Request a new link
          </LinkButton>
        </div>
      )}
    </AuthLayout>
  );
}
