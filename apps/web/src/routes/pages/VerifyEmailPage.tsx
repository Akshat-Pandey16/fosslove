import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { useVerifyEmail } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";

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

  return (
    <section>
      <h1>Verify your email</h1>

      {incomplete && (
        <p role="alert">
          This link is missing its verification code. Request a new one from the{" "}
          <Link to="/resend-verification">resend page</Link>.
        </p>
      )}

      {!incomplete && verify.isPending && <p aria-busy="true">Verifying…</p>}

      {verify.isSuccess && (
        <>
          <p>{verify.data.message}</p>
          <Link to="/login">Continue to log in</Link>
        </>
      )}

      {verify.isError && (
        <>
          <p role="alert">{messageFor(verify.error)}</p>
          <Link to="/resend-verification">Request a new link</Link>
        </>
      )}
    </section>
  );
}
