/**
 * @module app/page
 * Home page — introduces the Engineering Decision Graph and links into
 * the two main views (project list, influence chains). No data fetching
 * here; this is the static entry point.
 */
import Link from 'next/link';

export default function Home() {
	return (
		<main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24">
			<p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">
				Built on CognoDB
			</p>
			<h1 className="font-display text-3xl font-semibold text-zinc-50">
				DevTrace — an engineering decision graph
			</h1>
			<p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
				Not just a list of projects — a graph of real projects, the
				technologies chosen in each, and the lessons that carried from
				one project into the next. The connective tissue a relational
				schema struggles with and Cypher makes natural.
			</p>

			<div className="mt-10 flex flex-col gap-3 sm:flex-row">
				<Link
					href="/projects"
					className="rounded-md bg-accent/10 px-5 py-3 text-center text-sm font-medium text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent/15"
				>
					Browse projects
				</Link>
				<Link
					href="/chains"
					className="rounded-md border border-zinc-800 px-5 py-3 text-center text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
				>
					View influence chains
				</Link>
			</div>
		</main>
	);
}
