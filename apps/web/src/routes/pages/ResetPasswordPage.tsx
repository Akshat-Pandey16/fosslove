import { type SyntheticEvent } from "react";
import { useSearchParams } from "react-router";
import { AuthLayout, AuthLink, AuthSuccess } from "@/components/AuthLayout";
import { useConfirmPasswordReset } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { Alert, Button, Field, Input, KeyIcon, LinkButton } from "@/ui";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const confirm = useConfirmPasswordReset();
  const incomplete = uid === "" || token === "";

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    confirm.mutate({ uid, token, new_password: formString(form, "new_password") });
  };

  if (incomplete) {
    return (
      <AuthLayout
        eyebrow="account recovery"
        title="Choose a new password"
        footer={<AuthLink to="/login">Back to log in</AuthLink>}
      >
        <div className="flex flex-col gap-5">
          <Alert tone="danger" title="This reset link is incomplete">
            It is missing the code that identifies your account. Request a fresh link and open it
            straight from your email client.
          </Alert>
          <LinkButton to="/forgot-password" variant="secondary" size="lg" block>
            Request a new one
          </LinkButton>
        </div>
      </AuthLayout>
    );
  }

  if (confirm.isSuccess) {
    return (
      <AuthLayout
        eyebrow="account recovery"
        title="Password updated"
        footer={<AuthLink to="/login">Back to log in</AuthLink>}
      >
        <AuthSuccess
          message={confirm.data.message}
          action={<LinkButton to="/login">Log in</LinkButton>}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="account recovery"
      title="Choose a new password"
      description="This link works only once. Choose the password you want to use from now on."
      footer={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field
          label="New password"
          htmlFor="new_password"
          hint="Pick something long and unique — a passphrase works well."
          required
        >
          <Input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
          />
        </Field>

        {confirm.isError && <Alert tone="danger">{messageFor(confirm.error)}</Alert>}

        <Button
          type="submit"
          size="lg"
          block
          loading={confirm.isPending}
          icon={<KeyIcon size={18} />}
        >
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
