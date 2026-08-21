/**
 * @module app/categories/[id]/page
 * Category detail view — the category's name plus every technology in
 * it and the projects that use each one. Distinguishes "category
 * doesn't exist" (NOT_FOUND) from "category exists but has no
 * technologies yet" (empty list).
 */
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';

type CategoryDetail = {
	category: { id: string; name: string };
	technologies: { technology: string; project: string }[];
};

export default function CategoryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { data, loading, error, errorCode, refetch } =
		useApiData<CategoryDetail>(`/api/categories/${id}`);

	const notFound = !loading && errorCode === 'NOT_FOUND';

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<Link
				href="/categories"
				className="mb-8 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-300"
			>
				← All categories
			</Link>

			{loading && <LoadingState label="Loading category…" />}

			{!loading && notFound && (
				<EmptyState
					title="Category not found"
					description={`No category with id "${id}" exists in the graph.`}
				/>
			)}

			{!loading && !notFound && error && (
				<ErrorState message={error} onRetry={refetch} />
			)}

			{!loading && !notFound && !error && data && (
				<>
					<header className="mb-10">
						<p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">
							Category
						</p>
						<h1 className="font-display text-2xl font-semibold text-zinc-50">
							{data.category.name}
						</h1>
						<p className="mt-2 text-sm text-zinc-500">
							Technologies in this category and the projects that
							use them.
						</p>
					</header>

					{data.technologies.length === 0 && (
						<EmptyState
							title="No technologies yet"
							description="No technology has been assigned to this category."
						/>
					)}

					{data.technologies.length > 0 && (
						<ul className="flex flex-col gap-3">
							{data.technologies.map((row, i) => (
								<li
									key={`${row.technology}-${row.project}-${i}`}
									className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4"
								>
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
										<span className="rounded bg-accent/15 px-2 py-0.5 text-accent">
											{row.technology}
										</span>
										<span className="text-zinc-600">
											used in →
										</span>
										<span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
											{row.project}
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
