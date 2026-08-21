import type { AggregateStats } from "./types";

/**
 * A 1-1000 rating of recent form.
 *
 * Six components each measure one metric against a baseline (worth zero) and an
 * elite benchmark (worth full points), scaled linearly and clamped in between.
 * The weights sum to 1000, so the score is the sum of what each component earned
 * and the breakdown always adds up to what the reader sees.
 *
 * Benchmarks are set around competitive-ladder norms rather than pro play: the
 * baseline is roughly a struggling game and the elite value is roughly the top of
 * the ladder, so a typical player lands mid-scale instead of pinned at either end.
 */
export interface ScoreComponent {
  key: string;
  label: string;
  /** What was actually measured, formatted for display. */
  detail: string;
  points: number;
  maxPoints: number;
}

export interface PerformanceTier {
  name: string;
  min: number;
  color: string;
}

export interface PerformanceScore {
  score: number;
  tier: PerformanceTier;
  nextTier: PerformanceTier | null;
  pointsToNext: number | null;
  /** Progress through the current tier, 0-1. */
  tierProgress: number;
  components: ScoreComponent[];
}

/** Ordinal ramp: neutral gray climbs to the brand accent. Never color alone — every badge shows its name. */
export const PERFORMANCE_TIERS: PerformanceTier[] = [
  { name: "Rookie", min: 1, color: "#7d8488" },
  { name: "Challenger", min: 150, color: "#8d7f84" },
  { name: "Contender", min: 300, color: "#9e7a80" },
  { name: "Specialist", min: 450, color: "#af747c" },
  { name: "Veteran", min: 600, color: "#c16d77" },
  { name: "Elite", min: 725, color: "#d36572" },
  { name: "Master", min: 850, color: "#e75a69" },
  { name: "Apex", min: 940, color: "#ff4655" },
];

const MAX_SCORE = 1000;

interface Benchmark {
  key: string;
  label: string;
  weight: number;
  /** Scores zero at or below this. */
  baseline: number;
  /** Scores full weight at or above this. */
  elite: number;
  value: (s: AggregateStats) => number | null;
  format: (value: number) => string;
}

const BENCHMARKS: Benchmark[] = [
  {
    key: "combat",
    label: "Combat",
    weight: 240,
    baseline: 130,
    elite: 340,
    value: (s) => s.acs,
    format: (v) => `${Math.round(v)} ACS`,
  },
  {
    key: "efficiency",
    label: "Efficiency",
    weight: 190,
    baseline: 0.65,
    elite: 1.55,
    value: (s) => s.kd,
    format: (v) => `${v.toFixed(2)} K/D`,
  },
  {
    key: "winning",
    label: "Winning",
    weight: 170,
    baseline: 0.3,
    elite: 0.7,
    value: (s) => s.winRate,
    format: (v) => `${Math.round(v * 100)}% win rate`,
  },
  {
    key: "precision",
    label: "Precision",
    weight: 150,
    baseline: 0.1,
    elite: 0.35,
    value: (s) => s.accuracy.headPercent,
    format: (v) => `${(v * 100).toFixed(1)}% headshots`,
  },
  {
    key: "impact",
    label: "Impact",
    weight: 130,
    baseline: 0.02,
    elite: 0.18,
    // An ace is weighted as two opening kills — both are round-swinging, aces more so.
    value: (s) =>
      s.roundsPlayed > 0 ? (s.firstBloods + s.aces * 2) / s.roundsPlayed : null,
    format: (v) => `${(v * 100).toFixed(1)} per 100 rounds`,
  },
  {
    key: "objective",
    label: "Objective",
    weight: 120,
    // Any spike work counts, so this starts at zero; ~3 plants/defuses a game is elite.
    baseline: 0,
    elite: 0.15,
    value: (s) =>
      s.roundsPlayed > 0 ? (s.plants + s.defuses) / s.roundsPlayed : null,
    format: (v) => `${(v * 100).toFixed(1)} per 100 rounds`,
  },
];

function tierFor(score: number): PerformanceTier {
  let current = PERFORMANCE_TIERS[0];
  for (const tier of PERFORMANCE_TIERS) {
    if (score >= tier.min) current = tier;
  }
  return current;
}

export function computePerformanceScore(stats: AggregateStats): PerformanceScore | null {
  if (stats.matchesPlayed === 0 || stats.roundsPlayed === 0) return null;

  const components: ScoreComponent[] = BENCHMARKS.map((benchmark) => {
    const value = benchmark.value(stats);
    const normalized =
      value === null
        ? 0
        : Math.min(
            Math.max((value - benchmark.baseline) / (benchmark.elite - benchmark.baseline), 0),
            1,
          );

    return {
      key: benchmark.key,
      label: benchmark.label,
      detail: value === null ? "No data" : benchmark.format(value),
      points: Math.round(normalized * benchmark.weight),
      maxPoints: benchmark.weight,
    };
  });

  const score = Math.min(
    MAX_SCORE,
    Math.max(
      1,
      components.reduce((total, component) => total + component.points, 0),
    ),
  );

  const tier = tierFor(score);
  const tierIndex = PERFORMANCE_TIERS.indexOf(tier);
  const nextTier = PERFORMANCE_TIERS[tierIndex + 1] ?? null;
  const tierCeiling = nextTier ? nextTier.min : MAX_SCORE;

  return {
    score,
    tier,
    nextTier,
    pointsToNext: nextTier ? nextTier.min - score : null,
    tierProgress:
      tierCeiling > tier.min ? (score - tier.min) / (tierCeiling - tier.min) : 1,
    components,
  };
}
