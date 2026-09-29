import type { Enums } from '@/shared/lib/database.types';
import { StatusPill, type StatusTone } from '@/shared/ui';
import type { AccountType } from '@/shared/lib/labels';

type PayoutState = Enums<'payout_status'>;

const labels: Record<AccountType, Record<PayoutState, string>> = {
  restaurant: {
    pending: 'Transferência Pix em andamento',
    done: 'Pix enviado ao freelancer',
    failed: 'A transferência falhou. Nossa equipe vai refazer o envio.',
  },
  professional: {
    pending: 'Pix a caminho da sua chave',
    done: 'Pix enviado para sua chave',
    failed: 'A transferência falhou. Nossa equipe vai refazer o envio.',
  },
};

const tones: Record<PayoutState, StatusTone> = {
  pending: 'attention',
  done: 'positive',
  failed: 'negative',
};

type PayoutStatusProps = {
  status: PayoutState | null | undefined;
  viewer: AccountType;
};

/** Situação da transferência Pix para o freelancer, depois da liberação. */
export function PayoutStatus({ status, viewer }: PayoutStatusProps) {
  if (!status) return null;
  return <StatusPill label={labels[viewer][status]} tone={tones[status]} />;
}
