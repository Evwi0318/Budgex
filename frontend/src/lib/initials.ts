/** Två bokstäver ur namnet, annars ur e-posten. Delas av profilsidan och
 *  knappen som leder dit, så avataren ser likadan ut på båda ställena. */
export function initials(name: string | null, email: string): string {
  const source = name?.trim();

  if (!source) return email.slice(0, 2).toUpperCase();

  const parts = source.split(/\s+/);
  const letters =
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);

  return letters.toUpperCase();
}
