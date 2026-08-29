/** Ett fel som API:t självt förklarat i sitt svar, till skillnad från nätverksfel */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** API:ts egen text visas rakt av; statuskoder och nätverksfel blir en läsbar rad */
export const saveError = (error: unknown): string =>
  error instanceof ApiError
    ? error.message
    : "Kunde inte spara. Kontrollera anslutningen och försök igen.";
