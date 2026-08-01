import { type SyntheticEvent } from "react";
import { AuthLayout, AuthLink, AuthSuccess } from "@/components/AuthLayout";
import { useResendVerification } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { Alert, Button, Field, Input, LinkButton, MailIcon } from "@/ui";

export function ResendVerificationPage() {
  const resend = useResendVerification();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    resend.mutate({ email: formString(form, "email") });
  };

  return (
    <AuthLayout
      eyebrow="email verification"
      title="Resend verification email"
      description={
        resend.isSuccess
          ? undefined
          : "Verification links expire. Tell us your address and a fresh one is on its way."
      }
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      {resend.isSuccess ? (
        <AuthSuccess
          title="Check your inbox"
          message={resend.data.message}
          action={
            <LinkButton to="/login" variant="secondary" size="sm">
              Back to log in
            </LinkButton>
          }
        />
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
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

          {resend.isError && <Alert tone="danger">{messageFor(resend.error)}</Alert>}

          <Button
            type="submit"
            size="lg"
            block
            loading={resend.isPending}
            icon={<MailIcon size={18} />}
          >
            Resend verification
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
