import type { ReactNode } from "react";

import styles from "./a11y.module.css";

export function SkipLink({ href = "#main-content", children = "Skip to main content" }: { href?: string; children?: ReactNode }) {
  return <a className={styles.skipLink} href={href}>{children}</a>;
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}

export function LiveStatus({ children }: { children: ReactNode }) {
  return <p className={styles.visuallyHidden} role="status" aria-live="polite">{children}</p>;
}
