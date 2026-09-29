/** Colunas de view vêm anuláveis nos tipos gerados; requireRows estreita as que a tabela garante. */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

export function requireRows<T extends object, K extends keyof T>(rows: T[], keys: readonly K[]) {
  return rows.filter((row): row is WithRequired<T, K> => keys.every((key) => row[key] != null));
}
