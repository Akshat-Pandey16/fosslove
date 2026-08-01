import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const CONTAINER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number | undefined;
  y?: number | undefined;
  className?: string | undefined;
  once?: boolean | undefined;
}) {
  const reduced = useReducedMotion();

  if (reduced === true) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  once = true,
}: {
  children: ReactNode;
  className?: string | undefined;
  once?: boolean | undefined;
}) {
  const reduced = useReducedMotion();

  if (reduced === true) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={CONTAINER}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  const reduced = useReducedMotion();

  if (reduced === true) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={ITEM}>
      {children}
    </motion.div>
  );
}
