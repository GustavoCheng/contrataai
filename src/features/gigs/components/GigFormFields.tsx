import { Controller, type UseFormReturn } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { formatReaisInput } from '@/shared/lib/format';
import { roleOptions } from '@/shared/lib/labels';
import { ChipSelect, FormTextField, Section, Text, spacing } from '@/shared/ui';
import { dayOptions } from '../schedule';
import type { GigFormInput, GigFormValues } from '../schemas';

type Props = { form: UseFormReturn<GigFormInput, unknown, GigFormValues> };

export function GigFormFields({ form }: Props) {
  return (
    <>
      <Section title="Cargo">
        <Controller
          control={form.control}
          name="role"
          render={({ field, fieldState }) => (
            <>
              <ChipSelect
                options={roleOptions}
                selected={field.value ? [field.value] : []}
                onToggle={field.onChange}
              />
              {fieldState.error && (
                <Text variant="caption" tone="danger">
                  {fieldState.error.message}
                </Text>
              )}
            </>
          )}
        />
      </Section>

      <Section title="Dia">
        <Controller
          control={form.control}
          name="day"
          render={({ field, fieldState }) => (
            <>
              <ChipSelect
                horizontal
                options={dayOptions()}
                selected={field.value ? [field.value] : []}
                onToggle={field.onChange}
              />
              {fieldState.error && (
                <Text variant="caption" tone="danger">
                  {fieldState.error.message}
                </Text>
              )}
            </>
          )}
        />
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

/** Máscara de horário enquanto digita: "1830" -> "18:30". */
function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
