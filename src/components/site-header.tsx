import Link from "next/link";
import { SearchForm } from "./search-form";

export function SiteHeader({ affinity }: { affinity?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1360px] items-center justify-between gap-6 px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="h-5 w-1 bg-accent transition-all group-hover:h-6" />
          <span className="eyebrow text-lg tracking-wide text-fg">
            Ranked<span className="text-accent">Tracker</span>
          </span>
        </Link>
        {/* Too cramped to be usable below sm; the logo links back to the full search. */}
        <div className="hidden sm:block">
          <SearchForm size="compact" defaultAffinity={affinity ?? "na"} />
        </div>
      </div>
    </header>
  );
}
