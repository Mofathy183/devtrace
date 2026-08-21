/**
 * Loads the Engineering Decision Graph into CognoDB.
 * Run with: pnpm tsx scripts/seed.ts
 * Idempotent: clears prior seed data first, so it's safe to re-run.
 */
import 'dotenv/config';
import neo4j from 'neo4j-driver';
import {
	projects,
	technologies,
	projectUses,
	lessons,
	skillCategories,
	technologyBelongsToCategory,
} from '@/lib/queries/seed-data';

async function main() {
	const uri = process.env.COGNODB_URI;
	const username = process.env.COGNODB_USERNAME;
	const password = process.env.COGNODB_PASSWORD;

	if (!uri || !username || !password) {
		throw new Error(
			'Missing COGNODB_URI / COGNODB_USERNAME / COGNODB_PASSWORD in env.'
		);
	}

	const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
	const session = driver.session();

	try {
		console.log('Verifying connectivity...');
		await driver.verifyConnectivity();

		console.log('Clearing existing seed data...');
		await session.run(`MATCH (n) DETACH DELETE n`);

		console.log(`Creating ${projects.length} Project nodes...`);
		await session.run(
			`UNWIND $projects AS p
       CREATE (:Project {id: p.id, name: p.name, summary: p.summary, startedAt: p.startedAt})`,
			{ projects }
		);

		console.log(`Creating ${technologies.length} Technology nodes...`);
		await session.run(
			`UNWIND $technologies AS t
       CREATE (:Technology {id: t.id, name: t.name, category: t.category})`,
			{ technologies }
		);

		console.log(
			`Creating ${skillCategories.length} SkillCategory nodes...`
		);
		await session.run(
			`UNWIND $categories AS c
   CREATE (:SkillCategory {id: c.id, name: c.name})`,
			{ categories: skillCategories }
		);

		console.log(
			`Creating ${technologyBelongsToCategory.length} BELONGS_TO_CATEGORY relationships...`
		);
		await session.run(
			`UNWIND $rels AS r
   MATCH (t:Technology {id: r.technology}), (c:SkillCategory {id: r.category})
   CREATE (t)-[:BELONGS_TO_CATEGORY]->(c)`,
			{ rels: technologyBelongsToCategory }
		);

		console.log(`Creating ${projectUses.length} USES relationships...`);
		await session.run(
			`UNWIND $rels AS r
       MATCH (p:Project {id: r.project}), (t:Technology {id: r.technology})
       CREATE (p)-[:USES]->(t)`,
			{ rels: projectUses }
		);

		console.log(`Creating ${lessons.length} Lesson nodes + edges...`);
		for (const lesson of lessons) {
			await session.run(
				`MATCH (taught:Project {id: $taughtBy})
         CREATE (l:Lesson {id: $id, title: $title, detail: $detail})
         CREATE (taught)-[:TAUGHT_LESSON]->(l)`,
				{
					id: lesson.id,
					title: lesson.title,
					detail: lesson.detail,
					taughtBy: lesson.taughtBy,
				}
			);
			for (const target of lesson.informs) {
				await session.run(
					`MATCH (l:Lesson {id: $lessonId}), (p:Project {id: $projectId})
           CREATE (l)-[:INFORMED]->(p)`,
					{ lessonId: lesson.id, projectId: target }
				);
			}
		}

		// Indexes for lookups the brief calls out (id lookups)
		console.log('Creating indexes...');
		await session.run(
			`CREATE INDEX project_id IF NOT EXISTS FOR (p:Project) ON (p.id)`
		);
		await session.run(
			`CREATE INDEX technology_id IF NOT EXISTS FOR (t:Technology) ON (t.id)`
		);
		await session.run(
			`CREATE INDEX skillcategory_id IF NOT EXISTS FOR (c:SkillCategory) ON (c.id)`
		);

		const countResult = await session.run(
			`MATCH (n) RETURN count(n) AS nodeCount`
		);
		console.log(
			`Done. Total nodes: ${countResult.records[0].get('nodeCount')}`
		);
	} finally {
		await session.close();
		await driver.close();
	}
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
