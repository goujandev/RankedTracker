import type { PerformanceScore } from "./score";

export interface RiotId {
  name: string;
  tag: string;
}

export type Affinity = "na" | "eu" | "ap" | "kr" | "latam" | "br";

export interface Account {
  puuid: string;
  name: string;
  tag: string;
  region: string;
  accountLevel: number;
  cardId: string | null;
}

export interface RankTier {
  id: number;
  name: string;
}

export interface CurrentRank {
  tier: RankTier;
  rr: number;
  lastChange: number;
  elo: number;
  leaderboardRank: number | null;
}

export interface RankHistoryEntry {
  date: string;
  tier: RankTier;
  rr: number;
  /** Continuous ladder rating; unlike `rr` it does not reset at a tier boundary. */
  elo: number;
  lastChange: number;
  matchId: string | null;
}

export interface MatchSummary {
  matchId: string;
  map: string;
  mode: string;
  startedAt: string;
  won: boolean | null;
  roundsWon: number | null;
  roundsLost: number | null;
  roundsPlayed: number | null;
  agent: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  score: number | null;
  headshots: number | null;
  bodyshots: number | null;
  legshots: number | null;
  damageDealt: number | null;
  firstBloods: number;
  aces: number;
  plants: number;
  defuses: number;
  /** Kill counts by weapon name for this player in this match. */
  weaponKills: Record<string, number>;
}

export interface Accuracy {
  headshots: number;
  bodyshots: number;
  legshots: number;
  totalShots: number;
  headPercent: number | null;
  bodyPercent: number | null;
  legPercent: number | null;
}

export interface AgentStat {
  agent: string;
  matches: number;
  wins: number;
  winRate: number | null;
  kd: number | null;
  adr: number | null;
  acs: number | null;
}

export interface MapStat {
  map: string;
  matches: number;
  wins: number;
  winRate: number | null;
}

export interface WeaponStat {
  weapon: string;
  kills: number;
  share: number;
}

export interface AggregateStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number | null;
  roundsPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number | null;
  kda: number | null;
  acs: number | null;
  adr: number | null;
  killsPerRound: number | null;
  firstBloods: number;
  aces: number;
  plants: number;
  defuses: number;
  accuracy: Accuracy;
  agents: AgentStat[];
  maps: MapStat[];
  weapons: WeaponStat[];
}

export interface PlayerProfile {
  account: Account;
  currentRank: CurrentRank | null;
  peakRank: RankTier | null;
  rankHistory: RankHistoryEntry[];
  recentMatches: MatchSummary[];
  stats: AggregateStats;
  performance: PerformanceScore | null;
}

export class ValorantApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ValorantApiError";
  }
}
