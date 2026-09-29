import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Button, FormTextField, Notice, Screen, ScreenTitle } from '@/shared/ui';
import { useResendCode, useSignIn } from '../hooks/useAuthMutations';
import { signInSchema } from '../schemas';

export function SignInScreen() {
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const signIn = useSignIn();
  const resendCode = useResendCode();

  const submit = form.handleSubmit((values) =>
    signIn.mutate(values, {
      onError: (error) => {
        if (error.code !== 'email_not_confirmed') return;
        resendCode.mutate(values.email);
        router.push({ pathname: '/verify-email', params: { email: values.email } });
      },
    }),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={<Button title="Entrar" loading={signIn.isPending} onPress={submit} />}
    >
      <ScreenTitle title="Entrar" subtitle="Bom te ver de novo." />
      {signIn.error && signIn.error.code !== 'email_not_confirmed' && (
        <Notice message={signIn.error.message} />
      )}
      <FormTextField
        control={form.control}
        name="email"
        label="E-mail"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormTextField
        control={form.control}
        name="password"
        label="Senha"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={submit}
      />
    </Screen>
  );
}
