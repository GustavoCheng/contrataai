import { Controller, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';
import { TextField, type TextFieldProps } from './TextField';

type FormTextFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  /** Máscara aplicada enquanto a pessoa digita (ex.: CNPJ). */
  format?: (text: string) => string;
  /** Chamado com o valor já formatado (ex.: consultar o CEP quando completo). */
  onValueChange?: (value: string) => void;
};

/** TextField ligado ao react-hook-form: valor, blur e mensagem de erro do schema. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  format,
  onValueChange,
  ...props
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={field.value}
          onChangeText={(text) => {
            const value = format ? format(text) : text;
            field.onChange(value);
            onValueChange?.(value);
          }}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
