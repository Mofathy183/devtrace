import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: false,
		include: ['src/**/*.test.{ts,tsx}', '**/__tests__/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],
		setupFiles: ['./vitest.setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			// Targets from Engineering Standards — Testing & Documentation:
			// core/domain logic and utils/shared at 95%+, services at 90%+,
			// routes at 80%+. Enforced as a CI signal, not a hard gate here.
			thresholds: {
				'src/lib/queries/**': { statements: 95, branches: 90 },
				'src/lib/db.ts': { statements: 90, branches: 85 },
				'src/lib/errors.ts': { statements: 95, branches: 90 },
				'src/app/api/**': { statements: 80, branches: 70 },
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
		},
	},
});
