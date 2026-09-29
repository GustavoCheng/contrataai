import { ConfirmButton, Notice, Section } from '@/shared/ui';
import { useCancelGig, useOpenGigDispute } from '../hooks/useGigs';
import { CANCELLABLE, DISPUTABLE } from '../rules';
import type { Gig } from '../services/gigs.service';
import type { AccountType } from '@/shared/lib/labels';

const DISPUTE_HINT =
  'Se houver um problema com o freela, abra uma disputa: o valor fica retido até nossa equipe resolver.';

type GigIssueActionsProps = { gig: Gig; viewer: AccountType };

/** Imprevistos: o restaurante cancela até o check-in; qualquer parte abre disputa depois do Pix. */
export function GigIssueActions({ gig, viewer }: GigIssueActionsProps) {
  const cancel = useCancelGig(gig.id);
  const dispute = useOpenGigDispute(gig.id);
  const canCancel = viewer === 'restaurant' && CANCELLABLE.includes(gig.status);
  const canDispute = DISPUTABLE.includes(gig.status);
  if (!canCancel && !canDispute) return null;

  const cancelHint =
    gig.status === 'paid_held'
      ? 'Até o check-in, você pode cancelar e o valor pago volta por Pix.'
      : 'Você pode cancelar até o check-in.';
  const hint = [canCancel && cancelHint, canDispute && DISPUTE_HINT].filter(Boolean).join(' ');
  const error = cancel.error ?? dispute.error;

  return (
    <Section title="Imprevistos" hint={hint}>
      {error && <Notice message={error.message} />}
      {canCancel && (
        <ConfirmButton
          title="Cancelar freela"
          confirmTitle="Toque de novo para cancelar"
          loading={cancel.isPending}
          onConfirm={() => cancel.mutate()}
        />
      )}
      {canDispute && (
        <ConfirmButton
          title="Abrir disputa"
          confirmTitle="Toque de novo para abrir a disputa"
          loading={dispute.isPending}
          onConfirm={() => dispute.mutate()}
        />
      )}
    </Section>
  );
}
