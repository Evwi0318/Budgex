// All formatering av pengar och datum bor här — inget komponentlager
// formaterar själv, så siffrorna ser likadana ut i hela appen.

const kr = new Intl.NumberFormat("sv-SE", {
  style: "decimal",
  maximumFractionDigits: 0,
});

export const formatKr = (value: number): string => `${kr.format(value)} kr`;

/** Bara talet, för ytor där "kr" sätts i egen mindre stil */
export const formatNumber = (value: number): string => kr.format(value);

const short = new Intl.NumberFormat("sv-SE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Från en miljon och uppåt får talet inte plats i hero-kortet */
const SHORT_FROM = 1_000_000;

/** "1,2 mn kr" i stället för "1 234 567 kr" — exakta talet nås med långtryck */
export const formatKrShort = (value: number): string =>
  Math.abs(value) >= SHORT_FROM ? `${short.format(value)} kr` : formatKr(value);

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
