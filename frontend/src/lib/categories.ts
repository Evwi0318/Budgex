export type EntryKind = "Income" | "Expense";

export interface Category {
  value: string;
  label: string;
  emoji: string;
}

const expense: Category[] = [
  { value: "Housing", label: "Boende", emoji: "🏠" },
  { value: "Food", label: "Mat", emoji: "🛒" },
  { value: "Transport", label: "Transport", emoji: "🚌" },
  { value: "Bills", label: "Räkningar", emoji: "🧾" },
  { value: "Subscription", label: "Abonnemang", emoji: "🔄" },
  { value: "Loan", label: "Lån", emoji: "🏦" },
  { value: "Insurance", label: "Försäkring", emoji: "🛡️" },
  { value: "Health", label: "Hälsa", emoji: "💊" },
  { value: "Shopping", label: "Shopping", emoji: "🛍️" },
  { value: "Travel", label: "Resa", emoji: "✈️" },
  { value: "Other", label: "Övrigt", emoji: "❔" },
];

const income: Category[] = [
  { value: "Salary", label: "Lön", emoji: "💼" },
  { value: "Grant", label: "Bidrag", emoji: "🪙" },
  { value: "Transfer", label: "Överföring", emoji: "💸" },
  { value: "Sale", label: "Försäljning", emoji: "📦" },
  { value: "Other", label: "Övrigt", emoji: "❔" },
];

export const categoriesFor = (kind: EntryKind): Category[] =>
  kind === "Income" ? income : expense;

const fallback: Category = { value: "Other", label: "Övrigt", emoji: "❔" };

export const categoryOf = (kind: EntryKind, value: string): Category =>
  categoriesFor(kind).find((category) => category.value === value) ?? fallback;
