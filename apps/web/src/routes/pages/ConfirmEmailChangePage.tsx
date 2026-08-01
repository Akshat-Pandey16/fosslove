import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { useConfirmEmailChange } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";

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

  return (
    <section>
      <h1>Confirm your new email address</h1>

      {token === "" && <p role="alert">This link is missing its confirmation code.</p>}

      {token !== "" && confirm.isPending && <p aria-busy="true">Confirming…</p>}

      {confirm.isSuccess && (
        <>
          <p>{confirm.data.message}</p>
          <Link to="/login">Log in with your new address</Link>
        </>
      )}

      {confirm.isError && <p role="alert">{messageFor(confirm.error)}</p>}
    </section>
  );
}
