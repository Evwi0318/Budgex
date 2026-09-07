export interface Month {
  year: number;
  month: number;
}

const ordinal = ({ year, month }: Month) => year * 12 + month;

export const currentMonth = (): Month => {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
};

export const isPast = (month: Month) => ordinal(month) < ordinal(currentMonth());

export const isFuture = (month: Month) => ordinal(month) > ordinal(currentMonth());

export const shiftMonth = ({ year, month }: Month, steps: number): Month => {
  const moved = month - 1 + steps;

  return {
    year: year + Math.floor(moved / 12),
    month: ((moved % 12) + 12) % 12 + 1,
  };
};
