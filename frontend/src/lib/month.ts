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
