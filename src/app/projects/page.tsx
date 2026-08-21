/**
 * @module app/projects/page
 * Landing view: lists every Project in the graph, linking into each
 * project's influence view.
 */
'use client';

import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';

type ProjectRow = {
	id: string;
	name: string;
	summary: string;
	startedAt: string;
};

export default function ProjectsPage() {
	const { data, loading, error, refetch } =
		useApiData<ProjectRow[]>('/api/projects');

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<header className="mb-10">
				<p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">
					Engineering decision graph
				</p>
				<h1 className="font-display text-2xl font-semibold text-zinc-50">
					Projects
				</h1>
				<p className="mt-2 text-sm text-zinc-500">
					Real projects, the technologies chosen in each, and the
					lessons that carried from one into the next.
				</p>
			</header>

			{loading && <LoadingState label="Loading projects…" />}

			{!loading && error && (
				<ErrorState message={error} onRetry={refetch} />
			)}

			{!loading && !error && data && data.length === 0 && (
				<EmptyState
					title="No projects yet"
					description={
						<>
							Run{' '}
							<code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
								pnpm seed
							</code>{' '}
							to load the project graph.
						</>
					}
				/>
			)}

			{!loading && !error && data && data.length > 0 && (
				<ul className="flex flex-col gap-3">
					{data.map((project) => (
						<li key={project.id}>
							<Link
								href={`/projects/${project.id}`}
								className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
							>
								<div className="flex items-baseline justify-between gap-4">
									<span className="font-medium text-zinc-100">
										{project.name}
									</span>
									<span className="font-mono text-xs text-zinc-600">
										{project.startedAt}
									</span>
								</div>
								<p className="mt-1 text-sm text-zinc-500">
									{project.summary}
								</p>
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
