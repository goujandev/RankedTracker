import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ranked Tracker
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Look up a Valorant player&apos;s rank and match history.
        </p>
      </div>
      <SearchForm />
    </div>
  );
}
