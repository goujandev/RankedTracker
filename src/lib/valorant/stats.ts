import type { AggregateStats, MatchSummary } from "./types";

export function computeAggregateStats(matches: MatchSummary[]): AggregateStats {
  const decided = matches.filter((m) => m.won !== null);
  const wins = decided.filter((m) => m.won).length;

  const sum = (pick: (m: MatchSummary) => number | null) =>
    matches.reduce((total, m) => total + (pick(m) ?? 0), 0);

  const totalKills = sum((m) => m.kills);
  const totalDeaths = sum((m) => m.deaths);
  const totalAssists = sum((m) => m.assists);
  const totalHeadshots = sum((m) => m.headshots);
  const totalBodyshots = sum((m) => m.bodyshots);
  const totalLegshots = sum((m) => m.legshots);
  const totalDamage = sum((m) => m.damageDealt);
  const totalRounds = sum((m) => m.roundsPlayed);
  const totalShots = totalHeadshots + totalBodyshots + totalLegshots;
  const n = matches.length;

  return {
    matchesPlayed: n,
    wins,
    winRate: decided.length > 0 ? wins / decided.length : null,
    kd: totalDeaths > 0 ? totalKills / totalDeaths : null,
    kda: totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : null,
    headshotPercent: totalShots > 0 ? totalHeadshots / totalShots : null,
    adr: totalRounds > 0 ? totalDamage / totalRounds : null,
    avgKills: n > 0 ? totalKills / n : null,
    avgDeaths: n > 0 ? totalDeaths / n : null,
    avgAssists: n > 0 ? totalAssists / n : null,
  };
}
