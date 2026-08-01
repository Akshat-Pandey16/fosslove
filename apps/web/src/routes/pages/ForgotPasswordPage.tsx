import { type SyntheticEvent } from "react";
import { AuthLayout, AuthLink, AuthSuccess } from "@/components/AuthLayout";
import { useRequestPasswordReset } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { Alert, Button, Field, Input, LinkButton, MailIcon } from "@/ui";

export function ForgotPasswordPage() {
  const request = useRequestPasswordReset();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    request.mutate({ email: formString(form, "email") });
  };

  return (
    <AuthLayout
      eyebrow="account recovery"
      title="Reset your password"
      description={
        request.isSuccess
          ? undefined
          : "Give us the email you signed up with and we will send a link to set a new password."
      }
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      {request.isSuccess ? (
        <AuthSuccess
          title="Check your inbox"
          message={request.data.message}
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

          {request.isError && <Alert tone="danger">{messageFor(request.error)}</Alert>}

          <Button
            type="submit"
            size="lg"
            block
            loading={request.isPending}
            icon={<MailIcon size={18} />}
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
