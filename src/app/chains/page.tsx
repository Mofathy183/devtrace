/**
 * @module app/chains/page
 * Surfaces the variable-length path query as an SVG diagram per chain.
 * The longest chain is featured as a hero with a one-line summary of
 * what it shows — the app's actual thesis, stated once, up front —
 * with the remaining chains demoted to a secondary list.
 */
'use client';

import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';
import { ChainGraph } from '@/components/chain-graph';
import type { ChainResult } from '@/lib/queries/serialize-path';

function longestFirst(chains: ChainResult[]): ChainResult[] {
	return [...chains].sort((a, b) => b.nodes.length - a.nodes.length);
}

function summarize(chain: ChainResult): string {
	const first = chain.nodes[0]?.name ?? 'an earlier project';
	const last = chain.nodes[chain.nodes.length - 1]?.name ?? 'a later one';
	const hops = chain.steps.length;
	return `It took ${hops} hop${hops === 1 ? '' : 's'} for a decision in ${first} to reach ${last}.`;
}

export default function ChainsPage() {
	const { data, loading, error, refetch } =
		useApiData<ChainResult[]>('/api/chains');

	const ordered = data ? longestFirst(data) : [];
	const [hero, ...rest] = ordered;

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<Link
				href="/projects"
				className="mb-8 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-300"
			>
				← All projects
			</Link>

			<header className="mb-10">
				<p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">
					Variable-length traversal
				</p>
				<h1 className="font-display text-2xl font-semibold text-zinc-50">
					Influence chains
				</h1>
				<p className="mt-2 text-sm text-zinc-500">
					Every chain of influence between projects, of arbitrary
					depth — the query a relational schema would need a recursive
					CTE for.
				</p>
			</header>

			{loading && <LoadingState label="Tracing influence chains…" />}

			{!loading && error && (
				<ErrorState message={error} onRetry={refetch} />
			)}

			{!loading && !error && data && data.length === 0 && (
				<EmptyState
					title="No chains found"
					description="No multi-hop influence chains exist between projects yet."
				/>
			)}

			{!loading && !error && hero && (
				<>
					<section className="mb-10 overflow-x-auto rounded-xl border border-accent/30 bg-accent/4 px-6 py-6">
						<p className="mb-4 text-sm text-zinc-300">
							{summarize(hero)}
						</p>
						<ChainGraph chain={hero} />
					</section>

					{rest.length > 0 && (
						<>
							<h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
								More chains
							</h2>
							<ul className="flex flex-col gap-5">
								{rest.map((chain, i) => (
									<li
										key={i}
										className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4"
									>
										<ChainGraph chain={chain} />
									</li>
								))}
							</ul>
						</>
					)}
				</>
			)}
		</main>
	);
}
