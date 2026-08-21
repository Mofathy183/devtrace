/**
 * @module lib/queries/seed-data
 * Hand-authored seed content for the Engineering Decision Graph — real
 * project history (Beggy, PyLedger, UR-AIR), not fabricated. Written on
 * paper first per the build plan, then encoded here as the single source
 * `scripts/seed.ts` loads into CognoDB.
 *
 * @remarks
 * Data integrity here is a content problem, not a code problem: every
 * `Lesson.taughtBy` and `informs` id must reference a real `Project.id`
 * above, and every `projectUses` pair must reference real ids in both
 * `projects` and `technologies`. `scripts/seed.test.ts` asserts these
 * referential constraints so a typo'd id fails fast instead of silently
 * dropping an edge during seeding.
 */

export type ProjectSeed = {
	id: string;
	name: string;
	summary: string;
	startedAt: string; // ISO month
};

export type TechnologySeed = {
	id: string;
	name: string;
	category:
		'Backend' | 'Frontend' | 'DevOps' | 'Security' | 'Testing' | 'Database';
};

export type SkillCategorySeed = { id: string; name: string };

export type LessonSeed = {
	id: string;
	title: string;
	detail: string;
	taughtBy: string; // project id
	informs: string[]; // project id(s) this lesson influenced
};

export const projects: ProjectSeed[] = [
	{
		id: 'beggy',
		name: 'Beggy',
		summary:
			'Full-stack intelligent travel packing assistant, Turborepo monorepo.',
		startedAt: '2025-01',
	},
	{
		id: 'pyledger',
		name: 'PyLedger',
		summary: 'Double-entry accounting engine, async Python monorepo.',
		startedAt: '2026-05',
	},
	{
		id: 'ur-air',
		name: 'UR-AIR',
		summary: 'NestJS + MongoDB anime/quotes REST API.',
		startedAt: '2025-10',
	},
];

export const technologies: TechnologySeed[] = [
	{ id: 'express', name: 'Express.js', category: 'Backend' },
	{ id: 'nestjs', name: 'NestJS', category: 'Backend' },
	{ id: 'fastapi', name: 'FastAPI', category: 'Backend' },
	{ id: 'zod', name: 'Zod', category: 'Backend' },
	{ id: 'pydantic', name: 'Pydantic v2', category: 'Backend' },
	{ id: 'pino', name: 'Pino', category: 'Backend' },
	{ id: 'prisma', name: 'Prisma ORM', category: 'Database' },
	{ id: 'postgres', name: 'PostgreSQL', category: 'Database' },
	{ id: 'mongoose', name: 'Mongoose ODM', category: 'Database' },
	{ id: 'mongodb', name: 'MongoDB', category: 'Database' },
	{ id: 'neo4j-driver', name: 'neo4j-driver', category: 'Database' },
	{ id: 'jwt', name: 'JWT rotation', category: 'Security' },
	{ id: 'casl', name: 'CASL/RBAC', category: 'Security' },
	{ id: 'import-linter', name: 'import-linter', category: 'DevOps' },
	{ id: 'docker-compose', name: 'Docker Compose', category: 'DevOps' },
	{ id: 'gha', name: 'GitHub Actions', category: 'DevOps' },
	{ id: 'vitest', name: 'Vitest', category: 'Testing' },
	{ id: 'supertest', name: 'Supertest', category: 'Testing' },
	{
		id: 'fake-repo-tests',
		name: 'Fake-backed test suite',
		category: 'Testing',
	},
	{ id: 'nextjs', name: 'Next.js', category: 'Frontend' },
	{ id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend' },
	{ id: 'shadcn', name: 'shadcn/ui', category: 'Frontend' },
];

export const skillCategories: SkillCategorySeed[] = [
	{ id: 'backend', name: 'Backend' },
	{ id: 'frontend', name: 'Frontend' },
	{ id: 'devops', name: 'DevOps' },
	{ id: 'security', name: 'Security' },
	{ id: 'testing', name: 'Testing' },
	{ id: 'database', name: 'Database' },
];

// Project -> Technology (USES)
export const projectUses: { project: string; technology: string }[] = [
	{ project: 'beggy', technology: 'express' },
	{ project: 'beggy', technology: 'zod' },
	{ project: 'beggy', technology: 'pino' },
	{ project: 'beggy', technology: 'prisma' },
	{ project: 'beggy', technology: 'postgres' },
	{ project: 'beggy', technology: 'jwt' },
	{ project: 'beggy', technology: 'casl' },
	{ project: 'beggy', technology: 'docker-compose' },
	{ project: 'beggy', technology: 'gha' },
	{ project: 'beggy', technology: 'vitest' },
	{ project: 'beggy', technology: 'supertest' },
	{ project: 'beggy', technology: 'nextjs' },
	{ project: 'beggy', technology: 'tailwind' },
	{ project: 'beggy', technology: 'shadcn' },

	{ project: 'pyledger', technology: 'fastapi' },
	{ project: 'pyledger', technology: 'pydantic' },
	{ project: 'pyledger', technology: 'import-linter' },
	{ project: 'pyledger', technology: 'mongodb' },
	{ project: 'pyledger', technology: 'fake-repo-tests' },
	{ project: 'pyledger', technology: 'gha' },
	{ project: 'pyledger', technology: 'docker-compose' },

	{ project: 'ur-air', technology: 'nestjs' },
	{ project: 'ur-air', technology: 'mongoose' },
	{ project: 'ur-air', technology: 'mongodb' },
];

// Lessons: taught by one project, informing a later one — the INFORMED chain.
export const lessons: LessonSeed[] = [
	{
		id: 'lesson-race-conditions',
		title: 'Concurrent writes need explicit transaction guards',
		detail: "Beggy's RBAC/permission writes under load surfaced subtle race conditions that weren't caught by sequential tests.",
		taughtBy: 'beggy',
		informs: ['pyledger'],
	},
	{
		id: 'lesson-typed-errors',
		title: 'Symmetric success/error envelopes prevent ad hoc error shapes',
		detail: "PyLedger's typed ErrorCode catalog grew directly out of inconsistent error handling patterns first noticed in Beggy's API layer.",
		taughtBy: 'beggy',
		informs: ['pyledger'],
	},
	{
		id: 'lesson-fake-backed-tests',
		title: 'Fakes over mocks keep unit tests honest',
		detail: "PyLedger's fake-backed repository tests were a direct response to brittle, over-mocked tests in earlier work.",
		taughtBy: 'pyledger',
		informs: ['ur-air'],
	},
	{
		id: 'lesson-seed-refresh',
		title: 'Seed data needs a refresh path, not just an initial load',
		detail: "UR-AIR's seeded data pipeline with refresh support came from repeatedly wiping and reseeding Beggy's dev database by hand.",
		taughtBy: 'beggy',
		informs: ['ur-air'],
	},
	{
		id: 'lesson-layered-arch',
		title: 'Enforce layering with tooling, not convention',
		detail: "PyLedger's import-linter-enforced layered architecture is a direct response to layer violations that crept into Beggy's service-controller-route structure over time.",
		taughtBy: 'beggy',
		informs: ['pyledger'],
	},
	{
		id: 'lesson-structured-logging',
		title: 'Structured logs are required for debugging distributed failures',
		detail: 'Pino structured logging in Beggy made post-hoc debugging tractable; carried forward as a non-negotiable in every subsequent project.',
		taughtBy: 'beggy',
		informs: ['pyledger', 'ur-air'],
	},
];

const categoryIdByName: Record<TechnologySeed['category'], string> = {
	Backend: 'backend',
	Frontend: 'frontend',
	DevOps: 'devops',
	Security: 'security',
	Testing: 'testing',
	Database: 'database',
};

export const technologyBelongsToCategory: {
	technology: string;
	category: string;
}[] = technologies.map((t) => ({
	technology: t.id,
	category: categoryIdByName[t.category],
}));
