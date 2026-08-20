import Link from "next/link";
import { notFound } from "next/navigation";
import { getValorantProvider, ValorantApiError, type Affinity } from "@/lib/valorant";

function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function dec(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
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

  const statTiles = [
    { label: "K/D", value: dec(stats.kd) },
    { label: "KDA", value: dec(stats.kda) },
    { label: "HS%", value: pct(stats.headshotPercent) },
    { label: "ADR", value: stats.adr === null ? "—" : Math.round(stats.adr).toString() },
    { label: "Win Rate", value: pct(stats.winRate) },
    { label: "Avg K / D / A", value: `${dec(stats.avgKills, 1)} / ${dec(stats.avgDeaths, 1)} / ${dec(stats.avgAssists, 1)}` },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <Link
        href="/"
        className="w-fit text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; Search another player
      </Link>

      <header>
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-fg">
          {account.name}
          <span className="text-fg-subtle">#{account.tag}</span>
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Level {account.accountLevel} &middot; {account.region.toUpperCase()}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded border border-border bg-surface p-5 transition-colors hover:border-border-hover">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            Current Rank
          </p>
          {currentRank ? (
            <>
              <p className="mt-2 font-display text-3xl font-bold text-fg">
                {currentRank.tier.name}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                {currentRank.rr} RR
                {currentRank.lastChange !== 0 && (
                  <span className={currentRank.lastChange > 0 ? "text-positive" : "text-negative"}>
                    {" "}
                    ({currentRank.lastChange > 0 ? "+" : ""}
                    {currentRank.lastChange})
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 font-display text-3xl font-bold text-fg-muted">Unranked</p>
          )}
        </div>
        <div className="rounded border border-border bg-surface p-5 transition-colors hover:border-border-hover">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            Peak Rank
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-fg">
            {peakRank ? peakRank.name : "—"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-fg">
          Combat Stats
        </h2>
        <p className="mb-3 text-xs text-fg-subtle">Based on your last {stats.matchesPlayed} matches</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded border border-border bg-surface p-4 transition-colors hover:border-border-hover hover:bg-surface-hover"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                {tile.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-fg">{tile.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-fg">
          Recent Matches
        </h2>
        {recentMatches.length === 0 ? (
          <p className="text-fg-muted">No recent matches found.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentMatches.map((match) => (
              <li
                key={match.matchId}
                className={`group flex items-center justify-between rounded border-l-4 bg-surface px-4 py-3 transition-colors hover:bg-surface-hover ${
                  match.won === true
                    ? "border-l-positive"
                    : match.won === false
                      ? "border-l-negative"
                      : "border-l-fg-subtle"
                }`}
              >
                <div>
                  <p className="font-semibold text-fg">
                    {match.map} <span className="text-fg-subtle">&middot; {match.mode}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    {match.agent ?? "Unknown agent"} &middot; {match.kills}/{match.deaths}/
                    {match.assists}
                    {match.headshots !== null &&
                      match.bodyshots !== null &&
                      match.legshots !== null &&
                      match.headshots + match.bodyshots + match.legshots > 0 && (
                        <>
                          {" "}
                          &middot;{" "}
                          {pct(
                            match.headshots /
                              (match.headshots + match.bodyshots + match.legshots),
                          )}{" "}
                          HS
                        </>
                      )}
                  </p>
                </div>
                <p className="text-sm font-semibold text-fg-muted">{match.score ?? ""}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-fg">
          Rank History
        </h2>
        {rankHistory.length === 0 ? (
          <p className="text-fg-muted">No rank history available.</p>
        ) : (
          <ul className="flex flex-col text-sm">
            {rankHistory.slice(0, 20).map((entry, i) => (
              <li
                key={`${entry.matchId ?? i}-${entry.date}`}
                className="flex items-center justify-between border-b border-border px-1 py-2 transition-colors hover:bg-surface"
              >
                <span className="text-fg-subtle">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <span className="text-fg">
                  {entry.tier.name} ({entry.rr} RR)
                </span>
                <span className={entry.lastChange > 0 ? "text-positive" : "text-negative"}>
                  {entry.lastChange > 0 ? "+" : ""}
                  {entry.lastChange}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
