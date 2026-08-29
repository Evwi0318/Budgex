import { useCallback, useEffect, useState } from "react";
import { isPast } from "../lib/month";

/**
 * Gångna månader är skrivskyddade men kan låsas upp. Upplåsningen gäller
 * en månad och sparas aldrig — den återgår vid månadsbyte, när sidan lämnas
 * (kroken monteras ur), när fönstret tappar fokus och när appen hamnar i
 * bakgrunden.
 */
export function useMonthLock(year: number, month: number) {
  const [unlockedMonth, setUnlockedMonth] = useState<string | null>(null);
  const [shownMonth, setShownMonth] = useState(`${year}-${month}`);
  const key = `${year}-${month}`;

  // Nollställs under renderingen, inte i en effekt. Utan detta ligger
  // upplåsningen kvar i minnet när man bläddrar bort och tillbaka, och
  // månaden öppnar sig själv igen.
  if (shownMonth !== key) {
    setShownMonth(key);
    setUnlockedMonth(null);
  }

  useEffect(() => {
    const relock = () => setUnlockedMonth(null);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") relock();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", relock);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", relock);
    };
  }, []);

  const closed = isPast({ year, month });

  // Stabila mellan renderingar: Home memoiserar flikarnas innehåll, och nya
  // funktioner varje render skulle slå ut den memoiseringen.
  const unlock = useCallback(() => setUnlockedMonth(key), [key]);
  const relock = useCallback(() => setUnlockedMonth(null), []);

  return {
    isClosed: closed,
    isLocked: closed && unlockedMonth !== key,
    unlock,
    relock,
  };
}
