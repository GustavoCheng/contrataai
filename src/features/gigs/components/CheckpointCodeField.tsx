import { TextField } from '@/shared/ui';
import type { CheckpointKind } from '../services/gigs.service';

export const CHECKPOINT_CODE_LENGTH = 4;

const labels: Record<CheckpointKind, string> = {
  check_in: 'Código de check-in',
  check_out: 'Código de check-out',
};

type CheckpointCodeFieldProps = {
  kind: CheckpointKind;
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  error?: string;
};

/** Campo dos 4 dígitos que o freelancer recebe do restaurante. */
export function CheckpointCodeField({
  kind,
  value,
  onChange,
  onSubmit,
  error,
}: CheckpointCodeFieldProps) {
  return (
    <TextField
      label={labels[kind]}
      value={value}
      onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, CHECKPOINT_CODE_LENGTH))}
      onSubmitEditing={onSubmit}
      placeholder="0000"
      keyboardType="number-pad"
      returnKeyType="done"
      maxLength={CHECKPOINT_CODE_LENGTH}
      error={error}
      hint="São os 4 números que aparecem no app do restaurante."
    />
  );
}
