const CNPJ_PATTERN = /^[0-9A-Z]{12}[0-9]{2}$/;
const WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SEPARATORS = ['', '.', '.', '/', '-'];
const GROUPS: [number, number][] = [
  [0, 2],
  [2, 5],
  [5, 8],
  [8, 12],
  [12, 14],
];

export const normalizeCnpj = (value: string) => value.replace(/[^0-9a-z]/gi, '').toUpperCase();

/** Valida os dígitos verificadores, inclusive do CNPJ alfanumérico (letra vale código ASCII − 48). */
export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);
  if (!CNPJ_PATTERN.test(cnpj) || /^(.)\1+$/.test(cnpj)) return false;

  const checkDigit = (base: string) => {
    const weights = WEIGHTS.slice(WEIGHTS.length - base.length);
    const sum = [...base].reduce(
      (total, char, index) => total + (char.charCodeAt(0) - 48) * weights[index],
      0,
    );
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = checkDigit(cnpj.slice(0, 12));
  const second = checkDigit(cnpj.slice(0, 12) + first);
  return cnpj.slice(12) === `${first}${second}`;
}

/** Máscara progressiva: "12ABC34501DE35" -> "12.ABC.345/01DE-35". */
export function formatCnpj(value: string): string {
  const cnpj = normalizeCnpj(value).slice(0, 14);
  return GROUPS.map(([start, end], index) => {
    const part = cnpj.slice(start, end);
    return part && SEPARATORS[index] + part;
  }).join('');
}
