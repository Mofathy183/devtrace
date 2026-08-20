import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingState, EmptyState, ErrorState } from '@/components/state-views';

describe('LoadingState', () => {
	it('renders the default label when none is given', () => {
		render(<LoadingState />);
		expect(screen.getByText('Loading…')).toBeInTheDocument();
	});

	it('renders a custom label when given', () => {
		render(<LoadingState label="Loading projects…" />);
		expect(screen.getByText('Loading projects…')).toBeInTheDocument();
	});
});

describe('EmptyState', () => {
	it('renders the given title and description', () => {
		render(
			<EmptyState
				title="No projects yet"
				description="Run the seed script."
			/>
		);
		expect(screen.getByText('No projects yet')).toBeInTheDocument();
		expect(screen.getByText('Run the seed script.')).toBeInTheDocument();
	});
});

describe('ErrorState', () => {
	it('renders the error message', () => {
		render(<ErrorState message="Could not reach the server." />);
		expect(
			screen.getByText('Could not reach the server.')
		).toBeInTheDocument();
	});

	it('does not render a retry button when onRetry is omitted', () => {
		render(<ErrorState message="Failed." />);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('renders a retry button and calls onRetry when clicked', () => {
		const onRetry = vi.fn();
		render(<ErrorState message="Failed." onRetry={onRetry} />);

		fireEvent.click(screen.getByRole('button', { name: /try again/i }));

		expect(onRetry).toHaveBeenCalledOnce();
	});
});
