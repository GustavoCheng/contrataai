import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { formatCnpj } from '@/shared/lib/cnpj';
import { Button, FormTextField, Notice, Screen, ScreenTitle } from '@/shared/ui';
import { useRegisterRestaurant } from '../hooks/useAuthMutations';
import { signUpRestaurantSchema } from '../schemas';

export function SignUpRestaurantScreen() {
  const form = useForm({
    resolver: zodResolver(signUpRestaurantSchema),
    defaultValues: { cnpj: '', email: '', password: '' },
  });
  const register = useRegisterRestaurant();

  const submit = form.handleSubmit((values) =>
    register.mutate(values, {
      onSuccess: () =>
        router.replace({ pathname: '/verify-email', params: { email: values.email } }),
    }),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          title={register.isPending ? 'Consultando a Receita…' : 'Criar conta'}
          loading={register.isPending}
          onPress={submit}
        />
      }
    >
      <ScreenTitle
        title="Cadastre seu restaurante"
        subtitle="Confirmamos na Receita Federal que o CNPJ está ativo. Nome e endereço da loja vêm de lá."
      />
      {register.error && <Notice message={register.error.message} />}
      <FormTextField
        control={form.control}
        name="cnpj"
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        format={formatCnpj}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={18}
      />
      <FormTextField
        control={form.control}
        name="email"
        label="E-mail"
        placeholder="contato@seurestaurante.com"
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
