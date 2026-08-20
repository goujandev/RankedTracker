import Link from "next/link";
import { notFound } from "next/navigation";
import { getValorantProvider, ValorantApiError, type Affinity } from "@/lib/valorant";

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

  const { account, currentRank, peakRank, rankHistory, recentMatches } = profile;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        &larr; Search another player
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {account.name}
            <span className="text-zinc-400">#{account.tag}</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Level {account.accountLevel} &middot; {account.region.toUpperCase()}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Current Rank</p>
          {currentRank ? (
            <>
              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {currentRank.tier.name}
              </p>
              <p className="text-sm text-zinc-500">
                {currentRank.rr} RR
                {currentRank.lastChange !== 0 && (
                  <span className={currentRank.lastChange > 0 ? "text-green-500" : "text-red-500"}>
                    {" "}
                    ({currentRank.lastChange > 0 ? "+" : ""}
                    {currentRank.lastChange})
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="mt-1 text-zinc-500">Unranked</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Peak Rank</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {peakRank ? peakRank.name : "—"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Matches
        </h2>
        {recentMatches.length === 0 ? (
          <p className="text-zinc-500">No recent matches found.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentMatches.map((match) => (
              <li
                key={match.matchId}
                className={`flex items-center justify-between rounded-lg border-l-4 px-4 py-3 ${
                  match.won === true
                    ? "border-l-green-500 bg-green-50 dark:bg-green-950/30"
                    : match.won === false
                      ? "border-l-red-500 bg-red-50 dark:bg-red-950/30"
                      : "border-l-zinc-400 bg-zinc-50 dark:bg-zinc-900"
                }`}
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {match.map} &middot; {match.mode}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {match.agent ?? "Unknown agent"} &middot; {match.kills}/{match.deaths}/
                    {match.assists}
                  </p>
                </div>
                <p className="text-sm font-medium text-zinc-500">{match.score ?? ""}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Rank History
        </h2>
        {rankHistory.length === 0 ? (
          <p className="text-zinc-500">No rank history available.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {rankHistory.slice(0, 20).map((entry, i) => (
              <li
                key={`${entry.matchId ?? i}-${entry.date}`}
                className="flex items-center justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-900"
              >
                <span className="text-zinc-500">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <span className="text-zinc-900 dark:text-zinc-50">
                  {entry.tier.name} ({entry.rr} RR)
                </span>
                <span className={entry.lastChange > 0 ? "text-green-500" : "text-red-500"}>
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
