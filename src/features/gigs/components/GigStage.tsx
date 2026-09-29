import type { ComponentProps, ReactNode } from 'react';
import { PayoutStatus } from '@/features/payments';
import { firstName, formatMoney, formatTime } from '@/shared/lib/format';
import type { AccountType, GigStatus } from '@/shared/lib/labels';
import type { Gig } from '../services/gigs.service';
import { StatusCard } from './StatusCard';

type Stage = Omit<ComponentProps<typeof StatusCard>, 'children'>;

// O banco grava a hora de cada etapa ao trocar de estado; o traço só cobre um dado ausente.
const timeOf = (iso: string | null) => (iso ? formatTime(iso) : '—');

const disputed: Stage = {
  icon: 'alert-circle-outline',
  tone: 'negative',
  title: 'Disputa aberta',
  description: 'O valor fica retido até nossa equipe analisar o caso e falar com as duas partes.',
};

/** O card de cada etapa para quem vê; `open` não tem card. */
const stages: Record<AccountType, (gig: Gig) => Partial<Record<GigStatus, Stage>>> = {
  restaurant: (gig) => {
    const name = gig.professionals ? firstName(gig.professionals.full_name) : 'o freelancer';
    const amount = formatMoney(gig.amount_cents);
    return {
      confirmed: {
        icon: 'qr-code-outline',
        tone: 'attention',
        title: 'Falta pagar o Pix',
        description: `O valor fica retido com a ContrataAí e só vai para ${name} quando você liberar, depois do check-out.`,
      },
      paid_held: {
        icon: 'shield-checkmark-outline',
        tone: 'positive',
        title: 'Pagamento retido',
        description: `Quando ${name} chegar, mostre o código de check-in para digitar no app.`,
      },
      checked_in: {
        celebrate: true,
        icon: 'checkmark-circle',
        tone: 'positive',
        title: 'Check-in confirmado',
        description: `${name} chegou às ${timeOf(gig.checked_in_at)}. No fim do turno, mostre o código de check-out.`,
      },
      checked_out: {
        icon: 'time-outline',
        tone: 'attention',
        title: 'Turno encerrado',
        description: `Saída às ${timeOf(gig.checked_out_at)}. Se estiver tudo certo, libere o pagamento: ${amount} vão por Pix para ${name}.`,
      },
      released: {
        icon: 'cash-outline',
        tone: 'positive',
        title: 'Pagamento liberado',
        description: `${amount} para ${name}, por Pix.`,
      },
      cancelled: {
        icon: 'close-circle-outline',
        title: 'Freela cancelado',
        description:
          gig.payments?.status === 'refunded'
            ? `Estorno de ${amount} feito por Pix para a conta que pagou.`
            : undefined,
      },
      disputed,
    };
  },
  professional: (gig) => ({
    confirmed: {
      icon: 'time-outline',
      tone: 'attention',
      title: 'Freela confirmado',
      description:
        'Agora o restaurante paga o Pix. O valor fica retido com a ContrataAí e vai para sua chave Pix depois do turno.',
    },
    paid_held: {
      icon: 'shield-checkmark-outline',
      tone: 'positive',
      title: 'Pagamento garantido',
      description:
        'O valor já está retido. Ao chegar, peça o código de check-in ao restaurante e digite aqui.',
    },
    checked_in: {
      icon: 'checkmark-circle-outline',
      tone: 'positive',
      title: `Check-in às ${timeOf(gig.checked_in_at)}`,
      description: 'No fim do turno, peça o código de check-out ao restaurante e digite aqui.',
    },
    checked_out: {
      icon: 'time-outline',
      tone: 'attention',
      title: 'Turno encerrado',
      description: `Saída às ${timeOf(gig.checked_out_at)}. Assim que o restaurante liberar, o valor vai para sua chave Pix.`,
    },
    released: {
      celebrate: true,
      icon: 'cash-outline',
      tone: 'positive',
      title: 'Pagamento liberado!',
      description: `${formatMoney(gig.amount_cents)} para sua chave Pix.`,
    },
    cancelled: {
      icon: 'close-circle-outline',
      title: 'Freela cancelado',
      description: 'O restaurante cancelou este freela.',
    },
    disputed,
  }),
};

type GigStageProps = {
  gig: Gig;
  viewer: AccountType;
  /** Conteúdo da etapa: o Pix gerado ou o código de check-in/out (mostrar ou digitar). */
  children?: ReactNode;
};

export function GigStage({ gig, viewer, children }: GigStageProps) {
  const stage = stages[viewer](gig)[gig.status];
  if (!stage) return null;
  return (
    <StatusCard {...stage}>
      {children}
      {gig.status === 'released' && (
        <PayoutStatus status={gig.payments?.payout_status} viewer={viewer} />
      )}
    </StatusCard>
  );
}
