import "server-only";
import type { ValorantDataProvider } from "./provider";
import {
  Affinity,
  PlayerProfile,
  RankHistoryEntry,
  MatchSummary,
  ValorantApiError,
} from "./types";
import { computeAggregateStats } from "./stats";
import { computePerformanceScore } from "./score";

const BASE_URL = "https://api.henrikdev.xyz";

/** The matches endpoint caps out around 10 regardless of a larger `size`. */
const MATCH_SAMPLE_SIZE = 10;

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
      elo: number;
      last_change: number;
      match_id: string;
    }>;
  };
}

interface HenrikKill {
  round: number;
  time_in_round_in_ms: number;
  killer: { puuid: string };
  weapon: { name: string } | null;
}

interface HenrikMatch {
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
    stats: {
      score: number;
      kills: number;
      deaths: number;
      assists: number;
      headshots: number;
      bodyshots: number;
      legshots: number;
      damage: { dealt: number; received: number };
    };
  }>;
  teams: Array<{ team_id: string; won: boolean; rounds: { won: number; lost: number } }>;
  kills?: HenrikKill[];
  rounds?: Array<{
    plant: { player: { puuid: string } | null } | null;
    defuse: { player: { puuid: string } | null } | null;
  }>;
}

interface HenrikMatchesResponse {
  status: number;
  data: HenrikMatch[];
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

/**
 * Derives per-round achievements the flat player stats don't carry: opening
 * kills (earliest kill of a round) and aces (5+ kills in one round).
 */
function summarizeKills(kills: HenrikKill[] | undefined, puuid: string) {
  const byRound = new Map<number, HenrikKill[]>();
  const weaponKills: Record<string, number> = {};

  for (const kill of kills ?? []) {
    const bucket = byRound.get(kill.round);
    if (bucket) bucket.push(kill);
    else byRound.set(kill.round, [kill]);

    if (kill.killer.puuid === puuid) {
      const weapon = kill.weapon?.name ?? "Unknown";
      weaponKills[weapon] = (weaponKills[weapon] ?? 0) + 1;
    }
  }

  let firstBloods = 0;
  let aces = 0;

  for (const round of byRound.values()) {
    const opener = round.reduce((earliest, kill) =>
      kill.time_in_round_in_ms < earliest.time_in_round_in_ms ? kill : earliest,
    );
    if (opener.killer.puuid === puuid) firstBloods++;
    if (round.filter((k) => k.killer.puuid === puuid).length >= 5) aces++;
  }

  return { firstBloods, aces, weaponKills };
}

/** Spike plants and defuses are recorded on the round, not in the player's stat line. */
function summarizeObjectives(rounds: HenrikMatch["rounds"], puuid: string) {
  let plants = 0;
  let defuses = 0;

  for (const round of rounds ?? []) {
    if (round.plant?.player?.puuid === puuid) plants++;
    if (round.defuse?.player?.puuid === puuid) defuses++;
  }

  return { plants, defuses };
}

export class HenrikDevProvider implements ValorantDataProvider {
  async getPlayerProfile(
    riotId: { name: string; tag: string },
    affinity: Affinity,
  ): Promise<PlayerProfile> {
    const name = encodeURIComponent(riotId.name);
    const tag = encodeURIComponent(riotId.tag);

    const [accountRes, mmrRes, mmrHistoryRes, matchesRes] = await Promise.all([
      henrikFetch<HenrikAccountResponse>(`/valorant/v2/account/${name}/${tag}`),
      henrikFetch<HenrikMmrResponse>(`/valorant/v3/mmr/${affinity}/pc/${name}/${tag}`),
      henrikFetch<HenrikMmrHistoryResponse>(
        `/valorant/v2/mmr-history/${affinity}/pc/${name}/${tag}`,
      ),
      henrikFetch<HenrikMatchesResponse>(
        `/valorant/v4/matches/${affinity}/pc/${name}/${tag}?size=${MATCH_SAMPLE_SIZE}&mode=competitive`,
      ).catch(() => null),
    ]);

    const account = accountRes.data;
    const puuid = account.puuid;

    const rankHistory: RankHistoryEntry[] = mmrHistoryRes.data.history.map((entry) => ({
      date: entry.date,
      tier: entry.tier,
      rr: entry.rr,
      elo: entry.elo,
      lastChange: entry.last_change,
      matchId: entry.match_id ?? null,
    }));

    const recentMatches: MatchSummary[] = (matchesRes?.data ?? []).map((match) => {
      const me = match.players.find((p) => p.puuid === puuid) ?? null;
      const myTeam = me ? match.teams.find((t) => t.team_id === me.team_id) : undefined;
      const { firstBloods, aces, weaponKills } = summarizeKills(match.kills, puuid);
      const { plants, defuses } = summarizeObjectives(match.rounds, puuid);

      return {
        matchId: match.metadata.match_id,
        map: match.metadata.map.name,
        mode: match.metadata.queue.name,
        startedAt: match.metadata.started_at,
        won: myTeam ? myTeam.won : null,
        roundsWon: myTeam ? myTeam.rounds.won : null,
        roundsLost: myTeam ? myTeam.rounds.lost : null,
        roundsPlayed: myTeam ? myTeam.rounds.won + myTeam.rounds.lost : null,
        agent: me?.agent?.name ?? null,
        kills: me?.stats.kills ?? null,
        deaths: me?.stats.deaths ?? null,
        assists: me?.stats.assists ?? null,
        score: me?.stats.score ?? null,
        headshots: me?.stats.headshots ?? null,
        bodyshots: me?.stats.bodyshots ?? null,
        legshots: me?.stats.legshots ?? null,
        damageDealt: me?.stats.damage.dealt ?? null,
        firstBloods,
        aces,
        plants,
        defuses,
        weaponKills,
      };
    });

    const stats = computeAggregateStats(recentMatches);

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
      stats,
      performance: computePerformanceScore(stats),
    };
  }
}
