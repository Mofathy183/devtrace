/**
 * @module app/projects/[id]/page
 * Project detail view — fetches the project's real name/summary (rather
 * than deriving a display name from the URL slug) alongside the
 * multi-hop influence query result, and renders a distinct "not found"
 * state when the id doesn't match any project.
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

type ProjectRow = {
	id: string;
	name: string;
	summary: string;
	startedAt: string;
};

export default function ProjectInfluencePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const project = useApiData<ProjectRow>(`/api/projects/${id}`);
	const influence = useApiData<InfluenceRow[]>(
		`/api/projects/${id}/influence`
	);

	const loading = project.loading || influence.loading;
	const notFound = !project.loading && project.errorCode === 'NOT_FOUND';

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<Link
				href="/projects"
				className="mb-8 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-300"
			>
				← All projects
			</Link>

			{loading && <LoadingState label="Loading project…" />}

			{!loading && notFound && (
				<EmptyState
					title="Project not found"
					description={`No project with id "${id}" exists in the graph.`}
				/>
			)}

			{!loading && !notFound && project.error && (
				<ErrorState message={project.error} onRetry={project.refetch} />
			)}

			{!loading && !notFound && !project.error && project.data && (
				<>
					<header className="mb-10">
						<p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-400">
							Influence
						</p>
						<h1 className="text-2xl font-semibold text-zinc-50">
							{project.data.name}
						</h1>
						<p className="mt-2 text-sm text-zinc-500">
							{project.data.summary}
						</p>
					</header>

					{influence.error && (
						<ErrorState
							message={influence.error}
							onRetry={influence.refetch}
						/>
					)}

					{!influence.error &&
						influence.data &&
						influence.data.length === 0 && (
							<EmptyState
								title="No recorded influence"
								description="This project doesn't have any lessons from earlier projects linked to it yet."
							/>
						)}

					{!influence.error &&
						influence.data &&
						influence.data.length > 0 && (
							<ul className="flex flex-col gap-3">
								{influence.data.map((row, i) => (
									<li
										key={`${row.lessonTitle}-${row.technology}-${i}`}
										className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4"
									>
										<div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
											<span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
												{row.fromProject}
											</span>
											<span className="text-zinc-600">
												taught →
											</span>
											<span className="rounded bg-emerald-900/40 px-2 py-0.5 text-emerald-300">
												{row.lessonTitle}
											</span>
											<span className="text-zinc-600">
												→ used in
											</span>
											<span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
												{row.technology}
											</span>
										</div>
									</li>
								))}
							</ul>
						)}
				</>
			)}
		</main>
	);
}
