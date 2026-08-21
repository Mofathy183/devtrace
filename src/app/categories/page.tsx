/**
 * @module app/categories/page
 * Landing view: lists every SkillCategory with its technology count,
 * linking into each category's detail view.
 */
'use client';

import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';

type CategoryRow = {
	id: string;
	name: string;
	technologyCount: number;
};

export default function CategoriesPage() {
	const { data, loading, error, refetch } =
		useApiData<CategoryRow[]>('/api/categories');

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<header className="mb-10">
				<p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">
					Skill categories
				</p>
				<h1 className="font-display text-2xl font-semibold text-zinc-50">
					Categories
				</h1>
				<p className="mt-2 text-sm text-zinc-500">
					Every technology grouped by category, and which projects use
					each one.
				</p>
			</header>

			{loading && <LoadingState label="Loading categories…" />}

			{!loading && error && (
				<ErrorState message={error} onRetry={refetch} />
			)}

			{!loading && !error && data && data.length === 0 && (
				<EmptyState
					title="No categories yet"
					description={
						<>
							Run{' '}
							<code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
								pnpm seed
							</code>{' '}
							to load skill categories.
						</>
					}
				/>
			)}

			{!loading && !error && data && data.length > 0 && (
				<ul className="flex flex-col gap-3">
					{data.map((category) => (
						<li key={category.id}>
							<Link
								href={`/categories/${category.id}`}
								className="flex items-baseline justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
							>
								<span className="font-medium text-zinc-100">
									{category.name}
								</span>
								<span className="font-mono text-xs text-zinc-600">
									{category.technologyCount}{' '}
									{category.technologyCount === 1
										? 'technology'
										: 'technologies'}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
