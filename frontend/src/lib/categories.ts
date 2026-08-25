import {
  ArrowLeftRight,
  Briefcase,
  Bus,
  CircleDashed,
  Coins,
  House,
  Landmark,
  Package,
  Pill,
  Receipt,
  RefreshCw,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Plane,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EntryKind = "Income" | "Expense";

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

const expense: Category[] = [
  { value: "Housing", label: "Boende", icon: House },
  { value: "Food", label: "Mat", icon: ShoppingCart },
  { value: "Transport", label: "Transport", icon: Bus },
  { value: "Bills", label: "Räkningar", icon: Receipt },
  { value: "Subscription", label: "Abonnemang", icon: RefreshCw },
  { value: "Loan", label: "Lån", icon: Landmark },
  { value: "Insurance", label: "Försäkring", icon: Shield },
  { value: "Health", label: "Hälsa", icon: Pill },
  { value: "Shopping", label: "Shopping", icon: ShoppingBag },
  { value: "Travel", label: "Resa", icon: Plane },
  { value: "Other", label: "Övrigt", icon: CircleDashed },
];

const income: Category[] = [
  { value: "Salary", label: "Lön", icon: Briefcase },
  { value: "Grant", label: "Bidrag", icon: Coins },
  { value: "Transfer", label: "Överföring", icon: ArrowLeftRight },
  { value: "Sale", label: "Försäljning", icon: Package },
  { value: "Other", label: "Övrigt", icon: CircleDashed },
];

export const categoriesFor = (kind: EntryKind): Category[] =>
  kind === "Income" ? income : expense;

const fallback: Category = { value: "Other", label: "Övrigt", icon: CircleDashed };

export const categoryOf = (kind: EntryKind, value: string): Category =>
  categoriesFor(kind).find((category) => category.value === value) ?? fallback;
