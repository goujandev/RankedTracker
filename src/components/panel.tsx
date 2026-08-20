import type { ReactNode } from "react";

export function Panel({
  title,
  meta,
  children,
  bodyClassName = "px-5 py-5",
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="rounded-sm border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3">
        <h2 className="eyebrow text-sm text-fg">{title}</h2>
        {meta && <span className="text-xs text-fg-subtle">{meta}</span>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
