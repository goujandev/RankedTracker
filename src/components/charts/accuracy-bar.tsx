"use client";

import { useState } from "react";
import type { Accuracy } from "@/lib/valorant/types";

const SEGMENTS = [
  { key: "head", label: "Head", color: "var(--series-1)" },
  { key: "body", label: "Body", color: "var(--series-2)" },
  { key: "legs", label: "Legs", color: "var(--series-3)" },
] as const;

export function AccuracyBar({ accuracy }: { accuracy: Accuracy }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (accuracy.totalShots === 0) {
    return <p className="text-sm text-fg-muted">No shot data available.</p>;
  }

  const rows = [
    { ...SEGMENTS[0], hits: accuracy.headshots, pct: accuracy.headPercent ?? 0 },
    { ...SEGMENTS[1], hits: accuracy.bodyshots, pct: accuracy.bodyPercent ?? 0 },
    { ...SEGMENTS[2], hits: accuracy.legshots, pct: accuracy.legPercent ?? 0 },
  ];

  return (
    <div>
      {/* 2px surface gaps do the separating between segments — no strokes. */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.key}
            className="h-full transition-opacity first:rounded-l-sm last:rounded-r-sm"
            style={{
              width: `${row.pct * 100}%`,
              background: row.color,
              opacity: hovered && hovered !== row.key ? 0.45 : 1,
            }}
            onPointerEnter={() => setHovered(row.key)}
            onPointerLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <dl className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between text-sm"
            onPointerEnter={() => setHovered(row.key)}
            onPointerLeave={() => setHovered(null)}
          >
            <dt className="flex items-center gap-2 text-fg-muted">
              <span
                className="inline-block h-2 w-2 rounded-[1px]"
                style={{ background: row.color }}
                aria-hidden
              />
              {row.label}
            </dt>
            <dd className="tnum text-fg">
              {Math.round(row.pct * 100)}%
              <span className="ml-2 text-fg-subtle">{row.hits} hits</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
