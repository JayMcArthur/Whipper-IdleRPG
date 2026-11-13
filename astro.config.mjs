import { defineConfig } from 'astro/config';
import { base, site } from './src/lib/site.ts';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  publicDir: './agent-output/public',
  outDir: './agent-output/dist',
});
