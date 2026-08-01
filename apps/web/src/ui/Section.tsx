import type { ReactNode } from "react";
import { cx } from "./cx";

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string | undefined;
  id?: string | undefined;
}) {
  return (
    <section id={id} className={cx("shell py-[clamp(3.5rem,8vw,7rem)]", className)}>
      {children}
    </section>
  );
}
