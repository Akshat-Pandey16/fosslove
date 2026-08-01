import { AlertIcon, LinkButton } from "@/ui";

export function VerificationBanner() {
  return (
    <div className="shell pt-3">
      <div
        role="status"
        className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-full border border-honey/35 bg-honey-soft px-5 py-2.5 text-honey-ink"
      >
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          <AlertIcon size={18} />
        </span>
        <p className="min-w-0 flex-1 text-sm leading-relaxed">
          Your email address is not verified yet. Collections, favorites and script history stay
          locked until you confirm it.
        </p>
        <LinkButton to="/resend-verification" size="sm" variant="secondary" className="shrink-0">
          Resend the verification email
        </LinkButton>
      </div>
    </div>
  );
}
