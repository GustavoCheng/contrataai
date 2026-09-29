import type { UseFormReturn } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { formatReaisInput } from '@/shared/lib/format';
import { roleOptions } from '@/shared/lib/labels';
import { FormChipSelect, FormTextField, Section, spacing } from '@/shared/ui';
import { dayOptions } from '../schedule';
import type { GigFormInput, GigFormValues } from '../schemas';

type Props = { form: UseFormReturn<GigFormInput, unknown, GigFormValues> };

export function GigFormFields({ form }: Props) {
  return (
    <>
      <Section title="Cargo">
        <FormChipSelect control={form.control} name="role" options={roleOptions} />
      </Section>

      <Section title="Dia">
        <FormChipSelect control={form.control} name="day" options={dayOptions()} horizontal />
      </Section>

      <Section title="Horário" hint="Se terminar depois da meia-noite, o fim fica no dia seguinte.">
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormTextField
              control={form.control}
              name="startTime"
              label="Início"
              placeholder="18:00"
              keyboardType="number-pad"
              format={formatTimeInput}
              maxLength={5}
            />
          </View>
          <View style={styles.flex}>
            <FormTextField
              control={form.control}
              name="endTime"
              label="Fim"
              placeholder="23:30"
              keyboardType="number-pad"
              format={formatTimeInput}
              maxLength={5}
            />
          </View>
        </View>
      </Section>

      <FormTextField
        control={form.control}
        name="amount"
        label="Valor do freela (R$)"
        hint="Você paga por Pix ao confirmar; o valor fica retido até o fim do turno."
        placeholder="250"
        keyboardType="number-pad"
        format={formatReaisInput}
      />
    </>
  );
}

/** "1830" -> "18:30" enquanto digita. */
function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
