import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl border-l-2 border-accent pl-6">
        <h1 className="font-display text-6xl font-bold uppercase leading-[0.95] tracking-tight text-fg sm:text-7xl">
          Ranked
          <br />
          <span className="text-accent">Tracker</span>
        </h1>
        <p className="mt-4 max-w-md text-fg-muted">
          Competitive rank, combat stats, and match history for any Riot ID.
        </p>
        <div className="mt-8">
          <SearchForm />
        </div>
      </div>
    </main>
  );
}
