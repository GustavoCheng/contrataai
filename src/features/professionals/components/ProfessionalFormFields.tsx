import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { StyleSheet, Switch, View } from 'react-native';
import { useCepLookup } from '@/shared/hooks/useCepLookup';
import { useUserId } from '@/shared/hooks/useSession';
import { roleOptions } from '@/shared/lib/labels';
import { cepDigits, formatCep, formatPlace } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import {
  CepStatus,
  ChipSelect,
  FormChipSelect,
  FormTextField,
  Notice,
  Section,
  Text,
  colors,
  spacing,
} from '@/shared/ui';
import { useAvatarUpload } from '../hooks/useProfessional';
import { pixKeyPlaceholders, pixKeyTypeOptions } from '../pix';
import type { ProfessionalFormInput, ProfessionalFormValues } from '../schemas';
import { AvatarPicker } from './AvatarPicker';

type Props = { form: UseFormReturn<ProfessionalFormInput, unknown, ProfessionalFormValues> };

export function ProfessionalFormFields({ form }: Props) {
  const userId = useUserId();
  const avatar = useAvatarUpload(userId);
  const cep = useCepLookup();
  const [photoPath, fullName, mainRole, address, pixKeyType] = useWatch({
    control: form.control,
    name: ['photoPath', 'fullName', 'mainRole', 'address', 'pixKeyType'],
  });

  const changeCep = (value: string) => {
    const digits = cepDigits(value);
    form.setValue('address', null);
    if (digits.length !== 8) return;
    cep.mutate(digits, {
      onSuccess: (resolved) => {
        // Ignora respostas de um CEP que a pessoa já trocou.
        if (cepDigits(form.getValues('postalCode')) !== resolved.postalCode) return;
        form.setValue('address', resolved);
        form.clearErrors('postalCode');
      },
    });
  };

  return (
    <>
      <AvatarPicker
        uri={photoPath ? imageUrl('avatars', photoPath) : null}
        name={fullName}
        loading={avatar.isPending}
        onPress={() =>
          avatar.mutate(undefined, {
            onSuccess: (path) => path && form.setValue('photoPath', path),
          })
        }
      />
      {avatar.error && <Notice message={avatar.error.message} />}

      <FormTextField
        control={form.control}
        name="fullName"
        label="Nome completo"
        placeholder="Como os restaurantes vão te chamar"
        autoComplete="name"
        textContentType="name"
      />

      <Section title="Cargo principal">
        <FormChipSelect
          control={form.control}
          name="mainRole"
          options={roleOptions}
          onValueChange={(role) =>
            form.setValue(
              'secondaryRoles',
              (form.getValues('secondaryRoles') ?? []).filter((other) => other !== role),
            )
          }
        />
      </Section>

      <Section title="Outros cargos" hint="Opcional. Toque em quantos quiser.">
        <Controller
          control={form.control}
          name="secondaryRoles"
          render={({ field }) => {
            const selected = field.value ?? [];
            return (
              <ChipSelect
                options={roleOptions.filter((option) => option.value !== mainRole)}
                selected={selected}
                onToggle={(role) =>
                  field.onChange(
                    selected.includes(role)
                      ? selected.filter((other) => other !== role)
                      : [...selected, role],
                  )
                }
              />
            );
          }}
        />
      </Section>

      <FormTextField
        control={form.control}
        name="experience"
        label="Experiência"
        placeholder="Ex.: 5 anos em cozinha japonesa, domino sashimi e hot roll."
        multiline
        maxLength={1000}
      />

      <View style={styles.cep}>
        <FormTextField
          control={form.control}
          name="postalCode"
          label="CEP de onde você mora"
          hint="Mostramos só o bairro e a cidade no seu perfil."
          placeholder="00000-000"
          keyboardType="number-pad"
          format={formatCep}
          onValueChange={changeCep}
          maxLength={9}
        />
        <CepStatus
          loading={cep.isPending}
          error={cep.error?.message ?? null}
          place={address ? formatPlace(address) : null}
        />
      </View>

      <Controller
        control={form.control}
        name="availableForGigs"
        render={({ field }) => (
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text weight="semibold" tone="default">
                Disponível para freelas
              </Text>
              <Text variant="caption" tone="muted">
                Aparece no seu perfil para os restaurantes.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Disponível para freelas"
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: colors.primary }}
            />
          </View>
        )}
      />

      <Section title="Chave Pix" hint="Obrigatória para aceitar freelas. Só você vê.">
        <FormChipSelect control={form.control} name="pixKeyType" options={pixKeyTypeOptions} />
        <FormTextField
          control={form.control}
          name="pixKey"
          label="Chave"
          placeholder={pixKeyType ? pixKeyPlaceholders[pixKeyType] : 'Escolha o tipo acima'}
          keyboardType={
            pixKeyType === 'email'
              ? 'email-address'
              : pixKeyType === 'cpf' || pixKeyType === 'phone'
                ? 'number-pad'
                : 'default'
          }
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  cep: { gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  switchText: { flex: 1, gap: spacing.xs },
});
