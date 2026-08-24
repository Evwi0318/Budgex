import { useEffect, useState } from "react";
import { isPast } from "../lib/month";

/**
 * Gångna månader är skrivskyddade men kan låsas upp. Upplåsningen gäller
 * en månad och sparas aldrig — den återgår vid månadsbyte, när sidan lämnas
 * (kroken monteras ur) och när appen hamnar i bakgrunden.
 *
 * Att spara vilken månad som är upplåst i stället för en ja/nej-flagga gör
 * återlåsningen vid månadsbyte till en jämförelse i stället för en effekt.
 */
export function useMonthLock(year: number, month: number) {
  const [unlockedMonth, setUnlockedMonth] = useState<string | null>(null);
  const key = `${year}-${month}`;

  useEffect(() => {
    const relock = () => {
      if (document.visibilityState === "hidden") setUnlockedMonth(null);
    };

    document.addEventListener("visibilitychange", relock);
    return () => document.removeEventListener("visibilitychange", relock);
  }, []);

  const closed = isPast({ year, month });

  return {
    isClosed: closed,
    isLocked: closed && unlockedMonth !== key,
    unlock: () => setUnlockedMonth(key),
    relock: () => setUnlockedMonth(null),
  };
}
