import { formatKr, getMonthName } from "./format";
import type { RuleType, SavingsItem } from "../hooks/useSavingsQuery";
import { currentMonth, shiftMonth } from "./month";

export interface Draft {
  ruleType: RuleType;
  value: number;
}

export const draftAmount = (draft: Draft, available: number): number =>
  draft.ruleType === "Fixed"
    ? draft.value
    : Math.round((available * draft.value) / 100);

export const monthlyFromItems = (items: SavingsItem[]): number =>
  Math.ceil(items.reduce((sum, item) => sum + item.yearlyAmount, 0) / 12);

export interface GoalProgress {
  pct: number;
  nextPct: number;
  done: boolean;
  text: string;
  eta: string;
}

export function goalProgress(
  goal: number,
  saved: number,
  perMonth: number
): GoalProgress {
  const left = Math.max(0, goal - saved);
  const pct = Math.min(100, (saved / goal) * 100);

  if (left === 0) {
    return {
      pct: 100,
      nextPct: 0,
      done: true,
      text: `${formatKr(saved)} sparat`,
      eta: "Målet är nått 🎉",
    };
  }

  const text = `${formatKr(saved)} av ${formatKr(goal)}`;

  if (perMonth <= 0) {
    return { pct, nextPct: 0, done: false, text, eta: "inget avsatt" };
  }

  return {
    pct,
    nextPct: Math.min(100 - pct, (perMonth / goal) * 100),
    done: false,
    text,
    eta: `ungefär ${etaMonth(Math.ceil(left / perMonth))}`,
  };
}

function etaMonth(monthsAhead: number): string {
  const { year, month } = shiftMonth(currentMonth(), monthsAhead);

  return `${getMonthName(month)} ${year}`;
}

export const overAllocationText = (
  name: string,
  allocated: number,
  available: number
): string =>
  available === 0
    ? `${name} gav 0 kr den här månaden`
    : `Du fördelar ${formatKr(allocated)} från ${name} som ger ${formatKr(available)}`;
