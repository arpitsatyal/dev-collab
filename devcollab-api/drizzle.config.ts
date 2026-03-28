import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/common/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
