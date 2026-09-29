// Checa os tipos de cada Edge Function usando o import map (deno.json) dela.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const root = 'supabase/functions';

for (const name of readdirSync(root)) {
  const config = `${root}/${name}/deno.json`;
  if (!existsSync(config)) continue;
  execSync(`deno check --config ${config} ${root}/${name}/index.ts`, { stdio: 'inherit' });
}
