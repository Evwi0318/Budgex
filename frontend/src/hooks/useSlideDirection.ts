import { useState } from "react";

/**
 * Åt vilket håll innehållet ska glida: 1 framåt, -1 bakåt. Jämförelsen görs
 * under renderingen, så animationen hinner starta i samma bildruta som bytet.
 */
export function useSlideDirection(value: number): number {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);

  if (previous !== value) {
    setDirection(value < previous ? -1 : 1);
    setPrevious(value);
  }

  return direction;
}
