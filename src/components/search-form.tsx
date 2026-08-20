"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const AFFINITIES = [
  { value: "na", label: "North America" },
  { value: "eu", label: "Europe" },
  { value: "ap", label: "Asia Pacific" },
  { value: "kr", label: "Korea" },
  { value: "latam", label: "Latin America" },
  { value: "br", label: "Brazil" },
];

export function SearchForm() {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [affinity, setAffinity] = useState("na");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = riotId.trim();
    const hashIndex = trimmed.lastIndexOf("#");

    if (hashIndex <= 0 || hashIndex === trimmed.length - 1) {
      setError("Enter a Riot ID in the format Name#Tag");
      return;
    }

    const name = trimmed.slice(0, hashIndex);
    const tag = trimmed.slice(hashIndex + 1);
    setError(null);
    router.push(`/player/${affinity}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="Name#Tag"
          className="flex-1 rounded border border-border bg-surface px-4 py-2.5 text-base text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-accent"
        />
        <select
          value={affinity}
          onChange={(e) => setAffinity(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-2.5 text-base text-fg outline-none transition-colors focus:border-accent"
        >
          {AFFINITIES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded bg-accent px-4 py-2.5 text-base font-semibold uppercase tracking-wide text-white transition-colors hover:bg-accent-hover"
      >
        Search
      </button>
      {error && <p className="text-sm text-negative">{error}</p>}
    </form>
  );
}
