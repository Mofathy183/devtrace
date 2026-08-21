import { describe, it, expect } from 'vitest';
import {
	projects,
	technologies,
	projectUses,
	lessons,
	skillCategories,
	technologyBelongsToCategory,
} from '@/lib/queries/seed-data';

const projectIds = new Set(projects.map((p) => p.id));
const technologyIds = new Set(technologies.map((t) => t.id));

describe('seed data referential integrity', () => {
	it('has no duplicate project ids', () => {
		expect(projectIds.size).toBe(projects.length);
	});

	it('has no duplicate technology ids', () => {
		expect(technologyIds.size).toBe(technologies.length);
	});

	it('every projectUses.project references a real project id', () => {
		const missing = projectUses.filter((r) => !projectIds.has(r.project));
		expect(missing).toEqual([]);
	});

	it('every projectUses.technology references a real technology id', () => {
		const missing = projectUses.filter(
			(r) => !technologyIds.has(r.technology)
		);
		expect(missing).toEqual([]);
	});

	it('every lesson.taughtBy references a real project id', () => {
		const missing = lessons.filter((l) => !projectIds.has(l.taughtBy));
		expect(missing).toEqual([]);
	});

	it('every lesson.informs entry references a real project id', () => {
		const badLessons = lessons.filter((l) =>
			l.informs.some((target) => !projectIds.has(target))
		);
		expect(badLessons).toEqual([]);
	});

	it('no lesson informs the same project that taught it', () => {
		const selfInfluencing = lessons.filter((l) =>
			l.informs.includes(l.taughtBy)
		);
		expect(selfInfluencing).toEqual([]);
	});

	it('has at least one multi-hop chain (a lesson informing a project that itself taught a later lesson)', () => {
		const projectsThatTeach = new Set(lessons.map((l) => l.taughtBy));
		const chainExists = lessons.some((l) =>
			l.informs.some((target) => projectsThatTeach.has(target))
		);
		expect(chainExists).toBe(true);
	});
});

const categoryIds = new Set(skillCategories.map((c) => c.id));

describe('skill category referential integrity', () => {
	it('has no duplicate category ids', () => {
		expect(categoryIds.size).toBe(skillCategories.length);
	});

	it('every technology has exactly one BELONGS_TO_CATEGORY edge', () => {
		const withCategory = new Set(
			technologyBelongsToCategory.map((r) => r.technology)
		);
		expect(withCategory.size).toBe(technologyIds.size);
	});

	it('every technologyBelongsToCategory.technology references a real technology id', () => {
		const missing = technologyBelongsToCategory.filter(
			(r) => !technologyIds.has(r.technology)
		);
		expect(missing).toEqual([]);
	});

	it('every technologyBelongsToCategory.category references a real category id', () => {
		const missing = technologyBelongsToCategory.filter(
			(r) => !categoryIds.has(r.category)
		);
		expect(missing).toEqual([]);
	});
});
