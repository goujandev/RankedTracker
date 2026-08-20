"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const AFFINITIES = [
  { value: "na", label: "NA" },
  { value: "eu", label: "EU" },
  { value: "ap", label: "AP" },
  { value: "kr", label: "KR" },
  { value: "latam", label: "LATAM" },
  { value: "br", label: "BR" },
];

export function SearchForm({
  size = "hero",
  defaultAffinity = "na",
}: {
  size?: "hero" | "compact";
  defaultAffinity?: string;
}) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [affinity, setAffinity] = useState(defaultAffinity);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = riotId.trim();
    const hashIndex = trimmed.lastIndexOf("#");

    if (hashIndex <= 0 || hashIndex === trimmed.length - 1) {
      setError("Enter a Riot ID as Name#Tag");
      return;
    }

    setError(null);
    router.push(
      `/player/${affinity}/${encodeURIComponent(trimmed.slice(0, hashIndex))}/${encodeURIComponent(
        trimmed.slice(hashIndex + 1),
      )}`,
    );
  }

  const compact = size === "compact";
  const field = compact ? "h-9 text-sm" : "h-12 text-base";

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "flex items-center gap-2" : "flex w-full max-w-xl flex-col gap-2"}
    >
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="Name#Tag"
          aria-label="Riot ID"
          className={`${field} ${compact ? "w-52" : "flex-1"} rounded-sm border border-border bg-surface px-3 text-fg placeholder:text-fg-subtle outline-none transition-colors hover:border-border-hover focus:border-accent`}
        />
        <select
          value={affinity}
          onChange={(e) => setAffinity(e.target.value)}
          aria-label="Region"
          className={`${field} rounded-sm border border-border bg-surface px-2 text-fg outline-none transition-colors hover:border-border-hover focus:border-accent`}
        >
          {AFFINITIES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={`${field} eyebrow rounded-sm bg-accent px-5 text-[15px] text-white transition-colors hover:bg-accent-hover`}
        >
          Search
        </button>
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
    </form>
  );
}
