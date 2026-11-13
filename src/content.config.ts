import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({ title: z.string(), description: z.string(), order: z.number(), section: z.enum(['Start', 'Mechanics', 'Progression', 'Reference']) }),
});
export const collections = { guides };
