import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Button, FormTextField, Notice, Screen, ScreenTitle } from '@/shared/ui';
import { useSignUpProfessional } from '../hooks/useAuthMutations';
import { signUpProfessionalSchema } from '../schemas';

export function SignUpProfessionalScreen() {
  const form = useForm({
    resolver: zodResolver(signUpProfessionalSchema),
    defaultValues: { email: '', password: '' },
  });
  const signUp = useSignUpProfessional();

  const submit = form.handleSubmit((values) =>
    signUp.mutate(values, {
      onSuccess: () =>
        router.replace({ pathname: '/verify-email', params: { email: values.email } }),
    }),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={<Button title="Criar conta" loading={signUp.isPending} onPress={submit} />}
    >
      <ScreenTitle
        title="Crie sua conta"
        subtitle="Depois você monta seu perfil com foto, cargos e cidade."
      />
      {signUp.error && <Notice message={signUp.error.message} />}
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
        hint="Mínimo de 8 caracteres."
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />
    </Screen>
  );
}
