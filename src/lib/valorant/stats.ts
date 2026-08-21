import type {
  AgentStat,
  AggregateStats,
  MapStat,
  MatchSummary,
  WeaponStat,
} from "./types";

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function sum(matches: MatchSummary[], pick: (m: MatchSummary) => number | null): number {
  return matches.reduce((total, m) => total + (pick(m) ?? 0), 0);
}

function groupByAgent(matches: MatchSummary[]): AgentStat[] {
  const buckets = new Map<string, MatchSummary[]>();
  for (const match of matches) {
    if (!match.agent) continue;
    const bucket = buckets.get(match.agent);
    if (bucket) bucket.push(match);
    else buckets.set(match.agent, [match]);
  }

  return [...buckets.entries()]
    .map(([agent, played]) => {
      const decided = played.filter((m) => m.won !== null);
      const wins = decided.filter((m) => m.won).length;
      const rounds = sum(played, (m) => m.roundsPlayed);

      return {
        agent,
        matches: played.length,
        wins,
        winRate: ratio(wins, decided.length),
        kd: ratio(
          sum(played, (m) => m.kills),
          sum(played, (m) => m.deaths),
        ),
        adr: ratio(
          sum(played, (m) => m.damageDealt),
          rounds,
        ),
        acs: ratio(
          sum(played, (m) => m.score),
          rounds,
        ),
      };
    })
    .sort((a, b) => b.matches - a.matches || (b.acs ?? 0) - (a.acs ?? 0));
}

function groupByMap(matches: MatchSummary[]): MapStat[] {
  const buckets = new Map<string, MatchSummary[]>();
  for (const match of matches) {
    const bucket = buckets.get(match.map);
    if (bucket) bucket.push(match);
    else buckets.set(match.map, [match]);
  }

  return [...buckets.entries()]
    .map(([map, played]) => {
      const decided = played.filter((m) => m.won !== null);
      const wins = decided.filter((m) => m.won).length;
      return {
        map,
        matches: played.length,
        wins,
        winRate: ratio(wins, decided.length),
      };
    })
    .sort((a, b) => b.matches - a.matches || (b.winRate ?? 0) - (a.winRate ?? 0));
}

function groupByWeapon(matches: MatchSummary[]): WeaponStat[] {
  const totals = new Map<string, number>();
  for (const match of matches) {
    for (const [weapon, kills] of Object.entries(match.weaponKills)) {
      totals.set(weapon, (totals.get(weapon) ?? 0) + kills);
    }
  }

  const allKills = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([weapon, kills]) => ({
      weapon,
      kills,
      share: allKills > 0 ? kills / allKills : 0,
    }))
    .sort((a, b) => b.kills - a.kills);
}

export function computeAggregateStats(matches: MatchSummary[]): AggregateStats {
  const decided = matches.filter((m) => m.won !== null);
  const wins = decided.filter((m) => m.won).length;

  const kills = sum(matches, (m) => m.kills);
  const deaths = sum(matches, (m) => m.deaths);
  const assists = sum(matches, (m) => m.assists);
  const headshots = sum(matches, (m) => m.headshots);
  const bodyshots = sum(matches, (m) => m.bodyshots);
  const legshots = sum(matches, (m) => m.legshots);
  const totalShots = headshots + bodyshots + legshots;
  const roundsPlayed = sum(matches, (m) => m.roundsPlayed);

  return {
    matchesPlayed: matches.length,
    wins,
    losses: decided.length - wins,
    winRate: ratio(wins, decided.length),
    roundsPlayed,
    kills,
    deaths,
    assists,
    kd: ratio(kills, deaths),
    kda: ratio(kills + assists, deaths),
    acs: ratio(
      sum(matches, (m) => m.score),
      roundsPlayed,
    ),
    adr: ratio(
      sum(matches, (m) => m.damageDealt),
      roundsPlayed,
    ),
    killsPerRound: ratio(kills, roundsPlayed),
    firstBloods: sum(matches, (m) => m.firstBloods),
    aces: sum(matches, (m) => m.aces),
    plants: sum(matches, (m) => m.plants),
    defuses: sum(matches, (m) => m.defuses),
    accuracy: {
      headshots,
      bodyshots,
      legshots,
      totalShots,
      headPercent: ratio(headshots, totalShots),
      bodyPercent: ratio(bodyshots, totalShots),
      legPercent: ratio(legshots, totalShots),
    },
    agents: groupByAgent(matches),
    maps: groupByMap(matches),
    weapons: groupByWeapon(matches),
  };
}
