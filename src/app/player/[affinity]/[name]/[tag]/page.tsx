import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Panel } from "@/components/panel";
import { RrChart } from "@/components/charts/rr-chart";
import { AccuracyBar } from "@/components/charts/accuracy-bar";
import { getValorantProvider, ValorantApiError, type Affinity } from "@/lib/valorant";

function pct(value: number | null, digits = 0): string {
  return value === null ? "—" : `${(value * 100).toFixed(digits)}%`;
}

function dec(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
}

function round(value: number | null): string {
  return value === null ? "—" : Math.round(value).toString();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ affinity: string; name: string; tag: string }>;
}) {
  const { affinity, name, tag } = await params;

  let profile;
  try {
    profile = await getValorantProvider().getPlayerProfile(
      { name: decodeURIComponent(name), tag: decodeURIComponent(tag) },
      affinity as Affinity,
    );
  } catch (err) {
    if (err instanceof ValorantApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const { account, currentRank, peakRank, rankHistory, recentMatches, stats } = profile;

  const headline = [
    { label: "ACS", value: round(stats.acs), hint: "Avg combat score" },
    { label: "K/D", value: dec(stats.kd), hint: "Kills per death" },
    { label: "HS%", value: pct(stats.accuracy.headPercent, 1), hint: "Headshot rate" },
    { label: "Win %", value: pct(stats.winRate, 1), hint: `${stats.wins}W ${stats.losses}L` },
  ];

  const secondary = [
    { label: "ADR", value: round(stats.adr) },
    { label: "KAD", value: dec(stats.kda) },
    { label: "Kills/Round", value: dec(stats.killsPerRound, 2) },
    { label: "Kills", value: stats.kills.toString() },
    { label: "Deaths", value: stats.deaths.toString() },
    { label: "Assists", value: stats.assists.toString() },
    { label: "First Bloods", value: stats.firstBloods.toString() },
    { label: "Aces", value: stats.aces.toString() },
  ];

  const topWeaponKills = stats.weapons[0]?.kills ?? 0;

  return (
    <>
      <SiteHeader affinity={affinity} />

      <main className="mx-auto w-full max-w-[1360px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-l-2 border-accent pl-5">
          <div>
            <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight text-fg">
              {account.name}
              <span className="text-fg-subtle">#{account.tag}</span>
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              Level {account.accountLevel} · {account.region.toUpperCase()} · Last{" "}
              {stats.matchesPlayed} competitive matches
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <span>
              <span className="tnum text-2xl font-semibold text-positive">{stats.wins}</span>
              <span className="ml-1 text-fg-subtle">W</span>
            </span>
            <span>
              <span className="tnum text-2xl font-semibold text-negative">{stats.losses}</span>
              <span className="ml-1 text-fg-subtle">L</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left rail */}
          <div className="flex flex-col gap-5">
            <Panel title="Current Rating">
              {currentRank ? (
                <>
                  <p className="font-display text-4xl font-bold leading-none text-fg">
                    {currentRank.tier.name}
                  </p>
                  <p className="mt-2 text-sm text-fg-muted">
                    <span className="tnum">{currentRank.rr}</span> RR
                    {currentRank.lastChange !== 0 && (
                      <span
                        className={
                          currentRank.lastChange > 0
                            ? "tnum ml-2 text-positive"
                            : "tnum ml-2 text-negative"
                        }
                      >
                        {currentRank.lastChange > 0 ? "+" : ""}
                        {currentRank.lastChange} last game
                      </span>
                    )}
                  </p>
                  {/* Meter: fill and track are steps of the same ramp. */}
                  <div
                    className="mt-4 h-1.5 w-full rounded-sm bg-accent/20"
                    role="img"
                    aria-label={`${currentRank.rr} of 100 RR toward the next tier`}
                  >
                    <div
                      className="h-full rounded-sm bg-accent"
                      style={{ width: `${Math.min(currentRank.rr, 100)}%` }}
                    />
                  </div>
                  {currentRank.leaderboardRank !== null && (
                    <p className="mt-3 text-sm text-fg-muted">
                      Leaderboard #<span className="tnum">{currentRank.leaderboardRank}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="font-display text-3xl font-bold text-fg-muted">Unranked</p>
              )}

              <div className="mt-5 border-t border-border pt-4">
                <p className="eyebrow text-xs text-fg-subtle">Peak Rating</p>
                <p className="mt-1 font-display text-2xl font-bold text-fg">
                  {peakRank ? peakRank.name : "—"}
                </p>
              </div>
            </Panel>

            <Panel title="Accuracy" meta={`${stats.accuracy.totalShots} hits`}>
              <AccuracyBar accuracy={stats.accuracy} />
            </Panel>

            <Panel title="Top Weapons">
              {stats.weapons.length === 0 ? (
                <p className="text-sm text-fg-muted">No weapon data available.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.weapons.slice(0, 5).map((weapon) => (
                    <li key={weapon.weapon}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-fg">{weapon.weapon}</span>
                        <span className="tnum text-fg-muted">
                          {weapon.kills}
                          <span className="ml-2 text-fg-subtle">{pct(weapon.share)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-surface-2">
                        <div
                          className="h-full bg-series-1"
                          style={{
                            width: `${topWeaponKills > 0 ? (weapon.kills / topWeaponKills) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Maps">
              {stats.maps.length === 0 ? (
                <p className="text-sm text-fg-muted">No map data available.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.maps.map((map) => (
                    <li key={map.map}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-fg">{map.map}</span>
                        <span className="tnum text-fg-muted">
                          {pct(map.winRate)}
                          <span className="ml-2 text-fg-subtle">
                            {map.wins}W {map.matches - map.wins}L
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 flex h-1.5 w-full gap-0.5">
                        <div
                          className="h-full bg-positive"
                          style={{ width: `${(map.wins / map.matches) * 100}%` }}
                        />
                        <div
                          className="h-full bg-negative"
                          style={{
                            width: `${((map.matches - map.wins) / map.matches) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Main column */}
          <div className="flex flex-col gap-5">
            <Panel title="Overview" meta={`${stats.roundsPlayed} rounds played`} bodyClassName="">
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {headline.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`px-5 py-5 ${i > 0 ? "sm:border-l sm:border-border" : ""} ${i >= 2 ? "border-t border-border sm:border-t-0" : ""} ${i === 1 ? "border-l border-border sm:border-l" : ""} ${i === 3 ? "border-l border-border" : ""}`}
                  >
                    <p className="eyebrow text-xs text-fg-subtle">{stat.label}</p>
                    <p className="mt-1 text-3xl font-semibold leading-none text-fg">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-xs text-fg-subtle">{stat.hint}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
                {secondary.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`flex items-baseline justify-between px-5 py-3 ${
                      i % 2 === 1 ? "border-l border-border" : ""
                    } ${i % 4 !== 0 ? "sm:border-l sm:border-border" : "sm:border-l-0"} ${
                      i >= 2 ? "border-t border-border" : ""
                    } ${i >= 4 ? "sm:border-t sm:border-border" : "sm:border-t-0"}`}
                  >
                    <span className="text-sm text-fg-muted">{stat.label}</span>
                    <span className="tnum text-sm font-semibold text-fg">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Rank Progression" bodyClassName="py-5">
              <RrChart history={rankHistory.slice(0, 25)} />
            </Panel>

            <Panel title="Top Agents" bodyClassName="">
              {stats.agents.length === 0 ? (
                <p className="px-5 py-5 text-sm text-fg-muted">No agent data available.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="eyebrow px-5 py-2 text-xs font-semibold text-fg-subtle">
                        Agent
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        Matches
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        Win %
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        K/D
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        ADR
                      </th>
                      <th className="eyebrow px-5 py-2 text-right text-xs font-semibold text-fg-subtle">
                        ACS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.agents.map((agent) => (
                      <tr
                        key={agent.agent}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-hover"
                      >
                        <td className="px-5 py-3 font-medium text-fg">{agent.agent}</td>
                        <td className="tnum px-3 py-3 text-right text-fg-muted">
                          {agent.matches}
                        </td>
                        <td className="tnum px-3 py-3 text-right text-fg-muted">
                          {pct(agent.winRate)}
                        </td>
                        <td className="tnum px-3 py-3 text-right text-fg-muted">
                          {dec(agent.kd)}
                        </td>
                        <td className="tnum px-3 py-3 text-right text-fg-muted">
                          {round(agent.adr)}
                        </td>
                        <td className="tnum px-5 py-3 text-right font-semibold text-fg">
                          {round(agent.acs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Panel>

            <Panel title="Recent Matches" bodyClassName="">
              {recentMatches.length === 0 ? (
                <p className="px-5 py-5 text-sm text-fg-muted">No recent matches found.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="eyebrow py-2 pl-5 pr-3 text-xs font-semibold text-fg-subtle">
                        Match
                      </th>
                      <th className="eyebrow px-3 py-2 text-xs font-semibold text-fg-subtle">
                        Agent
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        Score
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        K / D / A
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        ACS
                      </th>
                      <th className="eyebrow px-3 py-2 text-right text-xs font-semibold text-fg-subtle">
                        ADR
                      </th>
                      <th className="eyebrow py-2 pl-3 pr-5 text-right text-xs font-semibold text-fg-subtle">
                        HS%
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMatches.map((match) => {
                      const shots =
                        (match.headshots ?? 0) + (match.bodyshots ?? 0) + (match.legshots ?? 0);
                      const hs = shots > 0 ? (match.headshots ?? 0) / shots : null;
                      const acs =
                        match.score !== null && match.roundsPlayed
                          ? match.score / match.roundsPlayed
                          : null;
                      const adr =
                        match.damageDealt !== null && match.roundsPlayed
                          ? match.damageDealt / match.roundsPlayed
                          : null;

                      return (
                        <tr
                          key={match.matchId}
                          className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-hover"
                        >
                          <td
                            className={`border-l-2 py-3 pl-5 pr-3 ${
                              match.won === true
                                ? "border-l-positive"
                                : match.won === false
                                  ? "border-l-negative"
                                  : "border-l-fg-subtle"
                            }`}
                          >
                            <p className="font-medium text-fg">{match.map}</p>
                            <p className="text-xs text-fg-subtle">
                              {relativeTime(match.startedAt)}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-fg-muted">{match.agent ?? "—"}</td>
                          <td className="tnum px-3 py-3 text-right">
                            <span
                              className={
                                match.won === true ? "text-positive" : "text-negative"
                              }
                            >
                              {match.roundsWon}
                            </span>
                            <span className="text-fg-subtle"> : </span>
                            <span className="text-fg-muted">{match.roundsLost}</span>
                          </td>
                          <td className="tnum px-3 py-3 text-right text-fg">
                            {match.kills} / {match.deaths} / {match.assists}
                          </td>
                          <td className="tnum px-3 py-3 text-right font-semibold text-fg">
                            {round(acs)}
                          </td>
                          <td className="tnum px-3 py-3 text-right text-fg-muted">
                            {round(adr)}
                          </td>
                          <td className="tnum py-3 pl-3 pr-5 text-right text-fg-muted">
                            {pct(hs)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </main>
    </>
  );
}
