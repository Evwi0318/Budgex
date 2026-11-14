const kr = new Intl.NumberFormat("sv-SE", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** Ett belopp som avrundas till noll ska aldrig visas som "−0" */
export const formatNumber = (value: number): string =>
  kr.format(value).replace(/^[-\u2212]0$/, "0");

export const formatKr = (value: number): string => `${formatNumber(value)} kr`;

const tenths = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });

/** Från en miljon och uppåt får talet inte plats i hero-kortet */
const SHORT_FROM = 1_000_000;

/**
 * "1,3 mn kr" i stället för "1 376 678 kr" — exakta talet nås med långtryck.
 * Talet kapas, det avrundas aldrig uppåt: 1 376 678 får inte visas som 1,4 mn.
 */
export const formatKrShort = (value: number): string => {
  if (Math.abs(value) < SHORT_FROM) return formatKr(value);

  return `${tenths.format(Math.trunc(value / 100_000) / 10)} mn kr`;
};

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

export const formatMonthYear = (month: number, year: number): string => {
  const name = getMonthName(month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};
