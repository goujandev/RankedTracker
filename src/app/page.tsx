import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-1 w-10 bg-accent" />
        <h1 className="font-display text-6xl font-bold uppercase tracking-tight text-fg sm:text-7xl">
          Ranked <span className="text-accent">Tracker</span>
        </h1>
        <p className="max-w-sm text-base text-fg-muted">
          Search a Riot ID to see current rank, match history, and combat stats.
        </p>
      </div>
      <SearchForm />
    </div>
  );
}
