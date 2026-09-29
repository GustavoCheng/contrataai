import { Button, StatusPill } from '@/shared/ui';
import type { ApplicationStatus } from '@/shared/lib/labels';

type Props = {
  status: ApplicationStatus | undefined;
  canAccept: boolean;
  loading: boolean;
  onAccept: () => void;
};

/** Aceite em um toque; depois do toque, mostra em que pé está. */
export function AcceptGigAction({ status, canAccept, loading, onAccept }: Props) {
  if (status === 'sent')
    return <StatusPill label="Aceito · aguardando o restaurante" tone="attention" />;
  if (status === 'accepted') return <StatusPill label="Você foi confirmado" tone="positive" />;
  if (status === 'rejected') return <StatusPill label="Outro profissional foi confirmado" />;
  return (
    <Button
      variant="secondary"
      title="Aceitar freela"
      disabled={!canAccept}
      loading={loading}
      onPress={onAccept}
    />
  );
}
