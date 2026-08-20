/**
 * @module app/layout
 * Root layout — wraps every page with the shared top nav (Home, Projects,
 * Chains) so every route is reachable without knowing the URL by heart.
 */
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'DevTrace — Engineering Decision Graph',
	description:
		'A graph of real projects, the technologies chosen in each, and the lessons that carried from one into the next — built on CognoDB.',
};

const navLinks = [
	{ href: '/', label: 'Home' },
	{ href: '/projects', label: 'Projects' },
	{ href: '/chains', label: 'Chains' },
];

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
				<header className="border-b border-zinc-800">
					<nav className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-4">
						<Link
							href="/"
							className="text-sm font-semibold tracking-tight text-zinc-50"
						>
							DevTrace
						</Link>
						<div className="flex gap-5">
							{navLinks.slice(1).map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
								>
									{link.label}
								</Link>
							))}
						</div>
					</nav>
				</header>
				<div className="flex flex-1 flex-col">{children}</div>
			</body>
		</html>
	);
}
