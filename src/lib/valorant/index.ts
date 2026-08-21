import "server-only";
import { HenrikDevProvider } from "./henrikdev";
import type { ValorantDataProvider } from "./provider";

export type {
  Accuracy,
  AgentStat,
  Affinity,
  AggregateStats,
  MapStat,
  MatchSummary,
  PlayerProfile,
  RankHistoryEntry,
  RankTier,
  RiotId,
  WeaponStat,
} from "./types";
export type { PerformanceScore, PerformanceTier, ScoreComponent } from "./score";
export { PERFORMANCE_TIERS } from "./score";
export { ValorantApiError } from "./types";

let provider: ValorantDataProvider | null = null;

export function getValorantProvider(): ValorantDataProvider {
  if (!provider) {
    provider = new HenrikDevProvider();
  }
  return provider;
}
