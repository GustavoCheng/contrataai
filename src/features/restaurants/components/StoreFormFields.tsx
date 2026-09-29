import { useWatch, type UseFormReturn } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useCepLookup } from '@/shared/hooks/useCepLookup';
import { cepDigits, formatCep, formatPlace } from '@/shared/lib/location';
import { CepStatus, FormTextField, Section, spacing } from '@/shared/ui';
import type { StoreFormInput, StoreFormValues } from '../schemas';

type Props = { form: UseFormReturn<StoreFormInput, unknown, StoreFormValues> };

export function StoreFormFields({ form }: Props) {
  const cep = useCepLookup();
  const address = useWatch({ control: form.control, name: 'address' });

  const changeCep = (value: string) => {
    const digits = cepDigits(value);
    form.setValue('address', null);
    if (digits.length !== 8) return;
    cep.mutate(digits, {
      onSuccess: (resolved) => {
        if (cepDigits(form.getValues('postalCode')) !== resolved.postalCode) return;
        form.setValue('address', resolved);
        // CEP geral (cidade pequena) não traz rua nem bairro: mantém o que foi digitado.
        if (resolved.street) form.setValue('street', resolved.street, { shouldValidate: true });
        if (resolved.neighborhood) form.setValue('neighborhood', resolved.neighborhood);
        form.clearErrors('postalCode');
      },
    });
  };

  return (
    <>
      <Section title="Sobre a loja">
        <FormTextField control={form.control} name="name" label="Nome da loja" />
        <FormTextField
          control={form.control}
          name="description"
          label="Descrição"
          placeholder="Ex.: Cozinha japonesa contemporânea, 60 lugares, delivery próprio."
          multiline
          maxLength={1000}
        />
      </Section>

      <Section title="Endereço" hint="Usamos para mostrar a distância até os profissionais.">
        <View style={styles.cep}>
          <FormTextField
            control={form.control}
            name="postalCode"
            label="CEP"
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
        <FormTextField control={form.control} name="street" label="Rua" />
        <View style={styles.row}>
          <View style={styles.number}>
            <FormTextField control={form.control} name="number" label="Número" />
          </View>
          <View style={styles.complement}>
            <FormTextField control={form.control} name="complement" label="Complemento" />
          </View>
        </View>
        <FormTextField control={form.control} name="neighborhood" label="Bairro" />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  cep: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  number: { flex: 1 },
  complement: { flex: 2 },
});
