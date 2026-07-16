import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/content/**/*.test.ts', 'tests/contact/**/*.test.ts']
  }
});
