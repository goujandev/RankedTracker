import { PERFORMANCE_TIERS, type PerformanceScore } from "@/lib/valorant";

export function PerformanceScorePanel({
  performance,
  matchesPlayed,
}: {
  performance: PerformanceScore;
  matchesPlayed: number;
}) {
  const { score, tier, nextTier, pointsToNext, tierProgress, components } = performance;
  const currentTierIndex = PERFORMANCE_TIERS.indexOf(tier);

  return (
    <section className="rounded-sm border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3">
        <h2 className="eyebrow text-sm text-fg">Performance Score</h2>
        <span className="text-xs text-fg-subtle">Form over {matchesPlayed} matches</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="border-b border-border px-5 py-6 lg:border-b-0 lg:border-r">
          <div className="flex items-baseline gap-3">
            {/* Hero figure: proportional figures, plain sans, one per page. */}
            <span className="text-6xl font-semibold leading-none text-fg">{score}</span>
            <span className="text-lg text-fg-subtle">/ 1000</span>
          </div>

          <p
            className="mt-3 font-display text-2xl font-bold uppercase tracking-wide"
            style={{ color: tier.color }}
          >
            {tier.name}
          </p>

          <div className="mt-4">
            <div
              className="h-1.5 w-full rounded-sm bg-accent/15"
              role="img"
              aria-label={
                nextTier
                  ? `${Math.round(tierProgress * 100)}% of the way from ${tier.name} to ${nextTier.name}`
                  : `Top tier reached at ${score} of 1000`
              }
            >
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.max(tierProgress * 100, 2)}%`,
                  background: tier.color,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-fg-muted">
              {nextTier ? (
                <>
                  <span className="tnum text-fg">{pointsToNext}</span> to{" "}
                  <span style={{ color: nextTier.color }}>{nextTier.name}</span>
                </>
              ) : (
                "Top tier reached"
              )}
            </p>
          </div>

          {/* The ladder is always readable as text — color never carries the tier alone. */}
          <ol className="mt-5 flex flex-col gap-1 border-t border-border pt-4">
            {PERFORMANCE_TIERS.map((t, i) => (
              <li
                key={t.name}
                className={`flex items-baseline justify-between text-xs ${
                  i === currentTierIndex ? "text-fg" : "text-fg-subtle"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-[1px]"
                    style={{ background: t.color, opacity: i <= currentTierIndex ? 1 : 0.3 }}
                    aria-hidden
                  />
                  {t.name}
                  {i === currentTierIndex && (
                    <span className="eyebrow text-[10px] text-fg-subtle">current</span>
                  )}
                </span>
                <span className="tnum">{t.min}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="px-5 py-6">
          <p className="mb-4 text-sm text-fg-muted">
            Each component scores a metric against a baseline and an elite benchmark. The
            six add up to the score above.
          </p>
          <ul className="flex flex-col gap-4">
            {components.map((component) => (
              <li key={component.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-fg">{component.label}</span>
                  <span className="tnum text-fg-muted">
                    <span className="font-semibold text-fg">{component.points}</span>
                    <span className="text-fg-subtle"> / {component.maxPoints}</span>
                  </span>
                </div>
                {/* Meter: fill and track are steps of one ramp. */}
                <div className="mt-1.5 h-1.5 w-full rounded-sm bg-accent/15">
                  <div
                    className="h-full rounded-sm bg-accent"
                    style={{ width: `${(component.points / component.maxPoints) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-fg-subtle">{component.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
