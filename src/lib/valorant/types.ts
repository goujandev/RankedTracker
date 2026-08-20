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
  lastChange: number;
  matchId: string | null;
}

export interface MatchSummary {
  matchId: string;
  map: string;
  mode: string;
  startedAt: string;
  won: boolean | null;
  score: string | null;
  agent: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
}

export interface PlayerProfile {
  account: Account;
  currentRank: CurrentRank | null;
  peakRank: RankTier | null;
  rankHistory: RankHistoryEntry[];
  recentMatches: MatchSummary[];
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
