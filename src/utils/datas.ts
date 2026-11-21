const MESES_MINUSCULOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const dois = (n: number) => String(n).padStart(2, '0');

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatarHora(d: Date): string {
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** Data dos cartões do diário: "Hoje, 20:15", "Ontem, 22:40" ou "05 nov, 08:10". */
export function formatarDataCurta(d: Date, agora: Date = new Date()): string {
  const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
  if (mesmoDia(d, agora)) return `Hoje, ${formatarHora(d)}`;
  if (mesmoDia(d, ontem)) return `Ontem, ${formatarHora(d)}`;
  const base = `${dois(d.getDate())} ${MESES_MINUSCULOS[d.getMonth()]}`;
  const ano = d.getFullYear() !== agora.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${base}${ano}, ${formatarHora(d)}`;
}

/** Data do detalhe: "08 nov 2026". */
export function formatarDataLonga(d: Date): string {
  return `${dois(d.getDate())} ${MESES_MINUSCULOS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Data e hora completas: "08/11/2026, 21:47". */
export function formatarDataHora(d: Date): string {
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}, ${formatarHora(d)}`;
}

/** Saudação do topo do diário. */
export function saudacao(d: Date = new Date()): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}
