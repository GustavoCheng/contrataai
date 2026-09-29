// Faz no sandbox do Asaas o que, em produção, acontece fora do app. Vale para o servidor que o
// app está usando (a nuvem por padrão, ou o local se existir um .env.local):
//   npm run sandbox:pay     -> paga o Pix pendente mais recente
//   npm run sandbox:payout  -> conclui o repasse mais recente
// O aviso ao servidor (webhook) sai daqui: o Asaas não alcança o servidor local e, no sandbox,
// não conclui transferências sozinho. Na nuvem o Asaas também avisa; o aviso repetido é ignorado.
import { asaas, secrets, webhookUrl } from './lib.mjs';

async function sendWebhook(body) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'asaas-access-token': secrets.ASAAS_WEBHOOK_TOKEN,
    },
    body: JSON.stringify(body),
  });
  console.log(`Aviso ${body.event} para ${new URL(webhookUrl).host} -> ${response.status}`);
  if (response.status === 401) {
    throw new Error('O servidor recusou o token do webhook. Rode "npm run cloud:setup".');
  }
}

const action = process.argv[2];

if (action === 'pay') {
  const { data } = await asaas('GET', '/payments?billingType=PIX&status=PENDING&limit=1');
  if (!data[0]) throw new Error('Nenhum Pix pendente. Toque em "Pagar com Pix" no app antes.');
  await asaas('POST', `/sandbox/payment/${data[0].id}/confirm`);
  console.log(`Pix ${data[0].id} de R$ ${data[0].value} confirmado no sandbox.`);
  await sendWebhook({ event: 'PAYMENT_RECEIVED', payment: { id: data[0].id } });
} else if (action === 'payout') {
  const { data } = await asaas('GET', '/transfers?limit=1');
  if (!data[0]) throw new Error('Nenhum repasse encontrado. Libere um pagamento no app antes.');
  await sendWebhook({ event: 'TRANSFER_DONE', transfer: { id: data[0].id } });
} else {
  throw new Error('Use: node scripts/asaas-sandbox.mjs pay | payout');
}
