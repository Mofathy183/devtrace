/**
 * @module components/state-views
 * The three states every data-driven view needs to handle deliberately:
 * loading, empty, and error. Built once here so every page composes the
 * same visual language instead of reinventing spinners/messages per view.
 */

/** Shown while a view's initial data fetch is in flight. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
	return (
		<div className="flex items-center justify-center gap-3 py-16 text-sm text-zinc-500">
			<span
				className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400"
				aria-hidden="true"
			/>
			<span>{label}</span>
		</div>
	);
}

/**
 * Shown when a fetch succeeded but returned no data — distinct from an
 * error, and framed as an invitation/explanation rather than an apology.
 */
export function EmptyState({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-6 py-14 text-center">
			<p className="text-sm font-medium text-zinc-200">{title}</p>
			<p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
				{description}
			</p>
		</div>
	);
}

/**
 * Shown when a fetch failed. Says what happened and offers a retry —
 * never a raw stack trace or exception message.
 *
 * @param message - A short, plain-language description of what went wrong.
 * @param onRetry - Optional retry handler; renders a "Try again" button when provided.
 */
export function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
}) {
	return (
		<div className="rounded-lg border border-red-900/50 bg-red-950/20 px-6 py-10 text-center">
			<p className="text-sm font-medium text-red-300">{message}</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className="mt-4 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
				>
					Try again
				</button>
			)}
		</div>
	);
}
