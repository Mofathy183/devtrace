/**
 * @module app/chains/page
 * Surfaces the variable-length path query — arbitrary-depth chains of
 * influence between projects — as an SVG diagram per chain.
 */
'use client';

import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';
import { ChainGraph } from '@/components/chain-graph';
import type { ChainResult } from '@/lib/queries/serialize-path';

export default function ChainsPage() {
	const { data, loading, error, refetch } =
		useApiData<ChainResult[]>('/api/chains');

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<Link
				href="/projects"
				className="mb-8 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-300"
			>
				← All projects
			</Link>

			<header className="mb-10">
				<p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-400">
					Variable-length traversal
				</p>
				<h1 className="text-2xl font-semibold text-zinc-50">
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

			{!loading && !error && data && data.length > 0 && (
				<ul className="flex flex-col gap-5">
					{data.map((chain, i) => (
						<li
							key={i}
							className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4"
						>
							<ChainGraph chain={chain} />
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
