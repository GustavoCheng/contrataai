import type { ReactNode } from 'react';
import { PayoutStatus } from '@/features/payments';
import { formatMoney, formatTime } from '@/shared/lib/format';
import { StatusCard } from './StatusCard';
import type { Gig } from '../services/gigs.service';

const DISPUTE_TEXT =
  'O valor fica retido até nossa equipe analisar o caso e falar com as duas partes.';

// O banco grava a hora de cada etapa ao trocar de estado; o traço só cobre um dado ausente.
const timeOf = (iso: string | null) => (iso ? formatTime(iso) : '—');

type GigStageProps = {
  gig: Gig;
  /** Conteúdo da etapa: o Pix gerado ou o código de check-in/out (mostrar ou digitar). */
  children?: ReactNode;
};

/** O que acontece agora no freela, do lado do restaurante (da confirmação em diante). */
export function RestaurantGigStage({ gig, children }: GigStageProps) {
  const name = gig.professionals?.full_name.split(' ')[0] ?? 'o freelancer';
  const amount = formatMoney(gig.amount_cents);

  switch (gig.status) {
    case 'confirmed':
      return (
        <StatusCard
          icon="qr-code-outline"
          tone="attention"
          title="Falta pagar o Pix"
          description={`O valor fica retido com a ContrataAí e só vai para ${name} quando você liberar, depois do check-out.`}
        >
          {children}
        </StatusCard>
      );
    case 'paid_held':
      return (
        <StatusCard
          icon="shield-checkmark-outline"
          tone="positive"
          title="Pagamento retido"
          description={`Quando ${name} chegar, mostre o código de check-in para digitar no app.`}
        >
          {children}
        </StatusCard>
      );
    case 'checked_in':
      return (
        <StatusCard
          celebrate
          icon="checkmark-circle"
          tone="positive"
          title="Check-in confirmado"
          description={`${name} chegou às ${timeOf(gig.checked_in_at)}. No fim do turno, mostre o código de check-out.`}
        >
          {children}
        </StatusCard>
      );
    case 'checked_out':
      return (
        <StatusCard
          icon="time-outline"
          tone="attention"
          title="Turno encerrado"
          description={`Saída às ${timeOf(gig.checked_out_at)}. Se estiver tudo certo, libere o pagamento: ${amount} vão por Pix para ${name}.`}
        />
      );
    case 'released':
      return (
        <StatusCard
          icon="cash-outline"
          tone="positive"
          title="Pagamento liberado"
          description={`${amount} para ${name}, por Pix.`}
        >
          <PayoutStatus status={gig.payments?.payout_status} viewer="restaurant" />
        </StatusCard>
      );
    case 'cancelled':
      return (
        <StatusCard
          icon="close-circle-outline"
          title="Freela cancelado"
          description={
            gig.payments?.status === 'refunded'
              ? `Estorno de ${amount} feito por Pix para a conta que pagou.`
              : undefined
          }
        />
      );
    case 'disputed':
      return (
        <StatusCard
          icon="alert-circle-outline"
          tone="negative"
          title="Disputa aberta"
          description={DISPUTE_TEXT}
        />
      );
    default:
      return null;
  }
}

/** O que acontece agora no freela, do lado do freelancer confirmado. */
export function ProfessionalGigStage({ gig, children }: GigStageProps) {
  switch (gig.status) {
    case 'confirmed':
      return (
        <StatusCard
          icon="time-outline"
          tone="attention"
          title="Freela confirmado"
          description="Agora o restaurante paga o Pix. O valor fica retido com a ContrataAí e vai para sua chave Pix depois do turno."
        />
      );
    case 'paid_held':
      return (
        <StatusCard
          icon="shield-checkmark-outline"
          tone="positive"
          title="Pagamento garantido"
          description="O valor já está retido. Ao chegar, peça o código de check-in ao restaurante e digite aqui."
        >
          {children}
        </StatusCard>
      );
    case 'checked_in':
      return (
        <StatusCard
          icon="checkmark-circle-outline"
          tone="positive"
          title={`Check-in às ${timeOf(gig.checked_in_at)}`}
          description="No fim do turno, peça o código de check-out ao restaurante e digite aqui."
        >
          {children}
        </StatusCard>
      );
    case 'checked_out':
      return (
        <StatusCard
          icon="time-outline"
          tone="attention"
          title="Turno encerrado"
          description={`Saída às ${timeOf(gig.checked_out_at)}. Assim que o restaurante liberar, o valor vai para sua chave Pix.`}
        />
      );
    case 'released':
      return (
        <StatusCard
          celebrate
          icon="cash-outline"
          tone="positive"
          title="Pagamento liberado!"
          description={`${formatMoney(gig.amount_cents)} para sua chave Pix.`}
        >
          <PayoutStatus status={gig.payments?.payout_status} viewer="professional" />
        </StatusCard>
      );
    case 'cancelled':
      return (
        <StatusCard
          icon="close-circle-outline"
          title="Freela cancelado"
          description="O restaurante cancelou este freela."
        />
      );
    case 'disputed':
      return (
        <StatusCard
          icon="alert-circle-outline"
          tone="negative"
          title="Disputa aberta"
          description={DISPUTE_TEXT}
        />
      );
    default:
      return null;
  }
}
