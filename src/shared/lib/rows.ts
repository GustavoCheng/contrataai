/**
 * Nos tipos gerados, toda coluna de view é anulável (o gerador não enxerga o NOT NULL das
 * tabelas de origem). `requireFields` estreita as colunas que a tabela garante, a partir do
 * próprio tipo gerado, sem redeclarar interfaces.
 */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

export function requireFields<T extends object, K extends keyof T>(
  row: T,
  keys: readonly K[],
): WithRequired<T, K> | null {
  return keys.every((key) => row[key] != null) ? (row as WithRequired<T, K>) : null;
}

export const isPresent = <T>(value: T | null | undefined): value is T => value != null;
