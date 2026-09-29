import { Controller, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';
import { ChipSelect } from './Chip';
import { Text } from './Text';

type FormChipSelectProps<T extends FieldValues, V extends string> = {
  control: Control<T>;
  name: FieldPathByValue<T, V | null | undefined>;
  options: readonly { value: V; label: string }[];
  horizontal?: boolean;
  /** Chamado com a opção escolhida (ex.: limpar outro campo que dependia dela). */
  onValueChange?: (value: V) => void;
};

/** Escolha única em chips ligada ao react-hook-form, com a mensagem de erro do schema. */
export function FormChipSelect<T extends FieldValues, V extends string>({
  control,
  name,
  options,
  horizontal,
  onValueChange,
}: FormChipSelectProps<T, V>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <>
          <ChipSelect
            horizontal={horizontal}
            options={options}
            selected={field.value ? [field.value as V] : []}
            onToggle={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
          />
          {fieldState.error && (
            <Text variant="caption" tone="danger">
              {fieldState.error.message}
            </Text>
          )}
        </>
      )}
    />
  );
}
