/** Game translations own the wording and units; values come from the selected level. */
export function formatEffect(template: string, value: number, locale: string): string {
  return template.replaceAll('{value}', new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(value));
}
