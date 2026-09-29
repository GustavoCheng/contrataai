import { useEffect, useState } from 'react';
import { Button } from './Button';

type ConfirmButtonProps = {
  title: string;
  confirmTitle: string;
  onConfirm: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
};

const CONFIRM_WINDOW_MS = 4000;

/** Ação que pede um segundo toque para confirmar (funciona igual no celular e na web). */
export function ConfirmButton({
  title,
  confirmTitle,
  onConfirm,
  variant = 'ghost',
  loading = false,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      variant={armed ? 'primary' : variant}
      title={armed ? confirmTitle : title}
      loading={loading}
      onPress={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    />
  );
}
