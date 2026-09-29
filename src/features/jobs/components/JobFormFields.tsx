import type { UseFormReturn } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { formatReaisInput } from '@/shared/lib/format';
import { roleOptions, shiftOptions } from '@/shared/lib/labels';
import { FormChipSelect, FormTextField, Section, spacing } from '@/shared/ui';
import type { JobFormInput, JobFormValues } from '../schemas';

type Props = { form: UseFormReturn<JobFormInput, unknown, JobFormValues> };

export function JobFormFields({ form }: Props) {
  return (
    <>
      <Section title="Cargo">
        <FormChipSelect control={form.control} name="role" options={roleOptions} />
      </Section>

      <Section title="Turno">
        <FormChipSelect control={form.control} name="shift" options={shiftOptions} />
      </Section>

      <Section title="Salário mensal" hint="Deixe o máximo em branco para salário fixo.">
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormTextField
              control={form.control}
              name="salaryMin"
              label="De (R$)"
              placeholder="3.500"
              keyboardType="number-pad"
              format={formatReaisInput}
            />
          </View>
          <View style={styles.flex}>
            <FormTextField
              control={form.control}
              name="salaryMax"
              label="Até (R$)"
              placeholder="Opcional"
              keyboardType="number-pad"
              format={formatReaisInput}
            />
          </View>
        </View>
      </Section>

      <FormTextField
        control={form.control}
        name="description"
        label="Descrição"
        placeholder="Rotina, experiência desejada, benefícios, dias de folga…"
        multiline
        maxLength={1000}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
