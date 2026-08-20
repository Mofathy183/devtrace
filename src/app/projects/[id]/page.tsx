/**
 * @module app/projects/[id]/page
 * Project detail view — surfaces the multi-hop influence query result
 * (earlier project → lesson → this project → technology) as a styled
 * path list. The force-graph visualization is a later polish pass; this
 * view must stand on its own without it.
 */
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';

type InfluenceRow = {
	lessonTitle: string;
	fromProject: string;
	technology: string;
};

export default function ProjectInfluencePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { data, loading, error, refetch } = useApiData<InfluenceRow[]>(
		`/api/projects/${id}/influence`
	);

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
					Influence
				</p>
				<h1 className="text-2xl font-semibold capitalize text-zinc-50">
					{id.replace(/-/g, ' ')}
				</h1>
				<p className="mt-2 text-sm text-zinc-500">
					Lessons from earlier projects that informed the technology
					choices made here.
				</p>
			</header>

			{loading && <LoadingState label="Loading influence graph…" />}

			{!loading && error && (
				<ErrorState message={error} onRetry={refetch} />
			)}

			{!loading && !error && data && data.length === 0 && (
				<EmptyState
					title="No recorded influence"
					description="This project doesn't have any lessons from earlier projects linked to it yet."
				/>
			)}

			{!loading && !error && data && data.length > 0 && (
				<ul className="flex flex-col gap-3">
					{data.map((row, i) => (
						<li
							key={`${row.lessonTitle}-${row.technology}-${i}`}
							className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4"
						>
							<div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
								<span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
									{row.fromProject}
								</span>
								<span className="text-zinc-600">taught →</span>
								<span className="rounded bg-emerald-900/40 px-2 py-0.5 text-emerald-300">
									{row.lessonTitle}
								</span>
								<span className="text-zinc-600">→ used in</span>
								<span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
									{row.technology}
								</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
