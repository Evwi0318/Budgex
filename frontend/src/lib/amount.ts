/** Samma tak som API:t avvisar över — fälten kan då aldrig skicka ett för stort belopp */
export const MAX_AMOUNT = 10_000_000;

/**
 * Siffror in, tal ut. Utan taket blir ett tillräckligt långt tal 1e+21 i fältet,
 * och sparningen avvisas av API:t först efteråt.
 */
export const parseAmount = (raw: string, max: number = MAX_AMOUNT): number =>
  Math.min(Number(raw.replace(/\D/g, "").slice(0, 15)) || 0, max);
