// Apoio aos scripts: leitura dos arquivos .env e chamadas ao Asaas. Nenhum valor é impresso.
import { existsSync, readFileSync } from 'node:fs';

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [
          line.slice(0, index).trim(),
          line
            .slice(index + 1)
            .trim()
            .replace(/^'(.*)'$/, '$1'),
        ];
      }),
  );
}

/** Segredos das Edge Functions (chave do Asaas, token do webhook). */
export const secrets = readEnvFile('supabase/functions/.env');

// O mesmo servidor que o app usa: o .env.local (Supabase local) tem prioridade sobre o .env.
const appEnv = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };

export const supabaseUrl = appEnv.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('Defina EXPO_PUBLIC_SUPABASE_URL no .env (veja .env.example).');

export const isLocalSupabase = ['localhost', '127.0.0.1'].includes(new URL(supabaseUrl).hostname);
export const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`;

export async function asaas(method, path, body) {
  const response = await fetch(`${secrets.ASAAS_API_URL}${path}`, {
    method,
    headers: {
      access_token: secrets.ASAAS_API_KEY,
      'User-Agent': 'ContrataAi',
      'Content-Type': 'application/json',
    },
    body: body && JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = data?.errors?.map((error) => error.description).join(' ') ?? '';
    throw new Error(`Asaas ${method} ${path}: ${response.status} ${reason}`);
  }
  return data;
}
