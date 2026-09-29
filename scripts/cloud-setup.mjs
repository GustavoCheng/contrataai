// Segredos e webhook do Asaas na nuvem; rode após "npx supabase login" e a cada segredo novo.
import { execSync } from 'node:child_process';
import { asaas, isLocalSupabase, secrets, supabaseUrl, webhookUrl } from './lib.mjs';

const WEBHOOK_NAME = 'ContrataAi';
const EVENTS = [
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_REFUNDED',
  'TRANSFER_DONE',
  'TRANSFER_FAILED',
  'TRANSFER_CANCELLED',
];

if (isLocalSupabase) {
  throw new Error(
    'O app está apontando para o Supabase local. Apague o .env ou .env.local e rode de novo.',
  );
}
for (const name of ['ASAAS_API_URL', 'ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN']) {
  if (!secrets[name]) throw new Error(`Falta ${name} em supabase/functions/.env.`);
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
console.log(`1/2 Enviando os segredos para o projeto ${projectRef}...`);
execSync(
  `npx supabase secrets set --env-file supabase/functions/.env --project-ref ${projectRef}`,
  { stdio: 'inherit' },
);

console.log(`2/2 Cadastrando o webhook no Asaas (${new URL(secrets.ASAAS_API_URL).host})...`);
const { email } = await asaas('GET', '/myAccount/commercialInfo/');
const { data: webhooks } = await asaas('GET', '/webhooks');
const existing = webhooks.find((webhook) => webhook.url === webhookUrl);
const config = {
  name: WEBHOOK_NAME,
  url: webhookUrl,
  email,
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  authToken: secrets.ASAAS_WEBHOOK_TOKEN,
  sendType: 'SEQUENTIALLY',
  events: EVENTS,
};
if (existing) await asaas('PUT', `/webhooks/${existing.id}`, config);
else await asaas('POST', '/webhooks', config);

console.log(`Pronto: webhook ${existing ? 'atualizado' : 'criado'} para ${webhookUrl}`);
