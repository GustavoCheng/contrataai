import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, Notice, Screen, ScreenTitle, Text, TextField } from '@/shared/ui';
import { useResendCode, useVerifyEmail } from '../hooks/useAuthMutations';
import { useCountdown } from '../hooks/useCountdown';

const CODE_LENGTH = 6;
const RESEND_INTERVAL_SECONDS = 60;

/** Com o código certo a sessão abre e o layout raiz leva para a área da conta. */
export function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const verify = useVerifyEmail();
  const resend = useResendCode();
  const countdown = useCountdown(RESEND_INTERVAL_SECONDS);

  const changeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) verify.mutate({ email, code: digits });
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          <Button
            title="Confirmar"
            loading={verify.isPending}
            disabled={code.length < CODE_LENGTH}
            onPress={() => verify.mutate({ email, code })}
          />
          <Button
            variant="ghost"
            title={
              countdown.secondsLeft > 0
                ? `Reenviar código em ${countdown.secondsLeft}s`
                : 'Reenviar código'
            }
            disabled={countdown.secondsLeft > 0}
            loading={resend.isPending}
            onPress={() => resend.mutate(email, { onSuccess: countdown.restart })}
          />
        </>
      }
    >
      <ScreenTitle
        title="Confirme seu e-mail"
        subtitle={`Enviamos um código de 6 dígitos para ${email}.`}
      />
      {verify.error && <Notice message={verify.error.message} />}
      {resend.error && <Notice message={resend.error.message} />}
      <TextField
        label="Código"
        value={code}
        onChangeText={changeCode}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        autoFocus
      />
      {resend.isSuccess && (
        <Text variant="caption" tone="muted">
          Código reenviado. Se não chegar, confira a caixa de spam.
        </Text>
      )}
    </Screen>
  );
}
