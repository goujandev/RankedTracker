import "server-only";
import type { ValorantDataProvider } from "./provider";
import {
  Affinity,
  PlayerProfile,
  RankHistoryEntry,
  MatchSummary,
  ValorantApiError,
} from "./types";

const BASE_URL = "https://api.henrikdev.xyz";

interface HenrikAccountResponse {
  status: number;
  data: {
    puuid: string;
    name: string;
    tag: string;
    region: string;
    account_level: number;
    card: string | null;
  };
}

interface HenrikMmrResponse {
  status: number;
  data: {
    current: {
      tier: { id: number; name: string };
      rr: number;
      last_change: number;
      elo: number;
      leaderboard_placement: { rank: number } | null;
    } | null;
    peak: {
      tier: { id: number; name: string };
    } | null;
  };
}

interface HenrikMmrHistoryResponse {
  status: number;
  data: {
    history: Array<{
      date: string;
      tier: { id: number; name: string };
      rr: number;
      last_change: number;
      match_id: string;
    }>;
  };
}

interface HenrikMatchesResponse {
  status: number;
  data: Array<{
    metadata: {
      match_id: string;
      map: { name: string };
      queue: { name: string };
      started_at: string;
    };
    players: Array<{
      puuid: string;
      team_id: string;
      agent: { name: string } | null;
      stats: { kills: number; deaths: number; assists: number };
    }>;
    teams: Array<{ team_id: string; won: boolean; rounds: { won: number; lost: number } }>;
  }>;
}

interface HenrikErrorResponse {
  errors: Array<{ code: number; message: string; status: number }>;
}

async function henrikFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.HENRIKDEV_API_KEY;
  if (!apiKey) {
    throw new ValorantApiError("Missing HENRIKDEV_API_KEY environment variable", 500);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: apiKey },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as HenrikErrorResponse | null;
    const message = body?.errors?.[0]?.message ?? `HenrikDev API request failed (${res.status})`;
    throw new ValorantApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

function encodeRiotId(part: string): string {
  return encodeURIComponent(part);
}

export class HenrikDevProvider implements ValorantDataProvider {
  async getPlayerProfile(
    riotId: { name: string; tag: string },
    affinity: Affinity,
  ): Promise<PlayerProfile> {
    const name = encodeRiotId(riotId.name);
    const tag = encodeRiotId(riotId.tag);

    const [accountRes, mmrRes, mmrHistoryRes, matchesRes] = await Promise.all([
      henrikFetch<HenrikAccountResponse>(`/valorant/v2/account/${name}/${tag}`),
      henrikFetch<HenrikMmrResponse>(`/valorant/v3/mmr/${affinity}/pc/${name}/${tag}`),
      henrikFetch<HenrikMmrHistoryResponse>(
        `/valorant/v2/mmr-history/${affinity}/pc/${name}/${tag}`,
      ),
      henrikFetch<HenrikMatchesResponse>(
        `/valorant/v4/matches/${affinity}/pc/${name}/${tag}?size=10`,
      ).catch(() => null),
    ]);

    const account = accountRes.data;
    const puuid = account.puuid;

    const rankHistory: RankHistoryEntry[] = mmrHistoryRes.data.history.map((entry) => ({
      date: entry.date,
      tier: entry.tier,
      rr: entry.rr,
      lastChange: entry.last_change,
      matchId: entry.match_id ?? null,
    }));

    const recentMatches: MatchSummary[] = (matchesRes?.data ?? []).map((match) => {
      const me = match.players.find((p) => p.puuid === puuid) ?? null;
      const myTeam = me ? match.teams.find((t) => t.team_id === me.team_id) : undefined;

      return {
        matchId: match.metadata.match_id,
        map: match.metadata.map.name,
        mode: match.metadata.queue.name,
        startedAt: match.metadata.started_at,
        won: myTeam ? myTeam.won : null,
        score: myTeam ? `${myTeam.rounds.won}-${myTeam.rounds.lost}` : null,
        agent: me?.agent?.name ?? null,
        kills: me?.stats.kills ?? null,
        deaths: me?.stats.deaths ?? null,
        assists: me?.stats.assists ?? null,
      };
    });

    return {
      account: {
        puuid,
        name: account.name,
        tag: account.tag,
        region: account.region,
        accountLevel: account.account_level,
        cardId: account.card,
      },
      currentRank: mmrRes.data.current
        ? {
            tier: mmrRes.data.current.tier,
            rr: mmrRes.data.current.rr,
            lastChange: mmrRes.data.current.last_change,
            elo: mmrRes.data.current.elo,
            leaderboardRank: mmrRes.data.current.leaderboard_placement?.rank ?? null,
          }
        : null,
      peakRank: mmrRes.data.peak?.tier ?? null,
      rankHistory,
      recentMatches,
    };
  }
}
