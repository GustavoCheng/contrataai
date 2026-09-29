import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Button } from '@/shared/ui';

const FEEDBACK_MS = 2500;

export function CopyPixButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    AccessibilityInfo.announceForAccessibility('Código Pix copiado');
  };

  return (
    <Button title={copied ? 'Código copiado' : 'Copiar código Pix'} onPress={() => void copy()} />
  );
}
