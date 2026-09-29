/**
 * Nos tipos gerados, toda coluna de view é anulável (o gerador não enxerga o NOT NULL das
 * tabelas de origem). `requireRows` estreita as colunas que a tabela garante, a partir do
 * próprio tipo gerado, sem redeclarar interfaces; uma linha sem elas seria bug da view e sai.
 */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

export function requireRows<T extends object, K extends keyof T>(rows: T[], keys: readonly K[]) {
  return rows.filter((row): row is WithRequired<T, K> => keys.every((key) => row[key] != null));
}
