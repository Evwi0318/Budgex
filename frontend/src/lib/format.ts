// All formatering av pengar och datum bor här — inget komponentlager
// formaterar själv, så siffrorna ser likadana ut i hela appen.

const kr = new Intl.NumberFormat("sv-SE", {
  style: "decimal",
  maximumFractionDigits: 0,
});

export const formatKr = (value: number): string => `${kr.format(value)} kr`;

const monthNames = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

/** month är 1-baserad (1 = januari), som i API:t */
export const getMonthName = (month: number): string => monthNames[month - 1];

/** "Augusti 2026" — versal begynnelsebokstav enligt design-specen */
export const formatMonthYear = (month: number, year: number): string => {
  const name = getMonthName(month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};
