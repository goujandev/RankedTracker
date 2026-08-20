"use client";

import { useMemo, useRef, useState } from "react";
import { tierNameFromElo } from "@/lib/valorant/tiers";
import type { RankHistoryEntry } from "@/lib/valorant/types";

const WIDTH = 720;
const HEIGHT = 240;
const PAD = { top: 16, right: 24, bottom: 28, left: 68 };

interface Point {
  x: number;
  y: number;
  entry: RankHistoryEntry;
}

export function RrChart({ history }: { history: RankHistoryEntry[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // API returns newest first; a time axis reads oldest to newest.
  const series = useMemo(() => [...history].reverse(), [history]);

  const { points, ticks, minElo, maxElo } = useMemo(() => {
    const elos = series.map((e) => e.elo);
    const lo = Math.min(...elos);
    const hi = Math.max(...elos);
    // Pad the domain to whole tier boundaries so gridlines mean something.
    const minElo = Math.floor(lo / 100) * 100;
    const maxElo = Math.max(Math.ceil(hi / 100) * 100, minElo + 100);

    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const scaleX = (i: number) =>
      PAD.left + (series.length <= 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
    const scaleY = (elo: number) =>
      PAD.top + plotH - ((elo - minElo) / (maxElo - minElo)) * plotH;

    const points: Point[] = series.map((entry, i) => ({
      x: scaleX(i),
      y: scaleY(entry.elo),
      entry,
    }));

    const ticks: Array<{ y: number; label: string }> = [];
    for (let elo = minElo; elo <= maxElo; elo += 100) {
      const label = tierNameFromElo(elo);
      if (label) ticks.push({ y: scaleY(elo), label });
    }

    return { points, ticks, minElo, maxElo };
  }, [series]);

  if (series.length < 2) {
    return (
      <p className="px-5 py-8 text-sm text-fg-muted">
        Not enough ranked history to plot a trend yet.
      </p>
    );
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${HEIGHT - PAD.bottom} L ${points[0].x} ${HEIGHT - PAD.bottom} Z`;
  const last = points[points.length - 1];
  const active = activeIndex === null ? null : points[activeIndex];
  const net = series[series.length - 1].elo - series[0].elo;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // The SVG scales to its container, so map client px back into viewBox units.
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i].x - x) < Math.abs(points[nearest].x - x)) nearest = i;
    }
    setActiveIndex(nearest);
  }

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between px-5 pb-3">
        <p className="text-sm text-fg-muted">
          Last {series.length} ranked games
        </p>
        <p className="text-sm text-fg-muted">
          Net{" "}
          <span className={net >= 0 ? "text-positive tnum" : "text-negative tnum"}>
            {net >= 0 ? "+" : ""}
            {net} RR
          </span>
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Rank progression over the last ${series.length} ranked games, net ${net} RR`}
        onPointerMove={handleMove}
        onPointerLeave={() => setActiveIndex(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight")
            setActiveIndex((i) => Math.min((i ?? -1) + 1, points.length - 1));
          if (e.key === "ArrowLeft")
            setActiveIndex((i) => Math.max((i ?? points.length) - 1, 0));
        }}
      >
        {ticks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--grid)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="tnum"
              fill="var(--fg-subtle)"
              fontSize="11"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="var(--accent)" fillOpacity="0.1" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke="var(--border-hover)"
            strokeWidth="1"
          />
        )}

        {/* End marker: 2px surface ring keeps it legible over the line. */}
        <circle cx={last.x} cy={last.y} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
        {active && active !== last && (
          <circle
            cx={active.x}
            cy={active.y}
            r="5"
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth="2"
          />
        )}

        <text
          x={points[0].x}
          y={HEIGHT - PAD.bottom + 18}
          fill="var(--fg-subtle)"
          fontSize="11"
        >
          {new Date(series[0].date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </text>
        <text
          x={last.x}
          y={HEIGHT - PAD.bottom + 18}
          textAnchor="end"
          fill="var(--fg-subtle)"
          fontSize="11"
        >
          {new Date(series[series.length - 1].date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </text>
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-12 z-10 min-w-40 -translate-x-1/2 rounded border border-border bg-surface-2 px-3 py-2 shadow-lg"
          style={{ left: `${(active.x / WIDTH) * 100}%` }}
        >
          <p className="font-semibold text-fg">
            {active.entry.tier.name}
            <span className="tnum text-fg-muted"> · {active.entry.rr} RR</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
            <span className="inline-block h-0.5 w-3 bg-accent" aria-hidden />
            <span
              className={
                active.entry.lastChange >= 0 ? "text-positive tnum" : "text-negative tnum"
              }
            >
              {active.entry.lastChange >= 0 ? "+" : ""}
              {active.entry.lastChange}
            </span>
            {new Date(active.entry.date).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
