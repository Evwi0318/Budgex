import {
  Home,
  ShoppingCart,
  Utensils,
  Bus,
  Dumbbell,
  Tv,
  Repeat,
  Receipt,
  Plane,
  CircleDashed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const categoryMap: Record<string, LucideIcon> = {
  Boende: Home,
  Mat: ShoppingCart,
  Restaurang: Utensils,
  Transport: Bus,
  Träning: Dumbbell,
  Streaming: Tv,
  Prenumeration: Repeat,
  Räkningar: Receipt,
  Resa: Plane,
  Övrigt: CircleDashed,
};

export function getCategoryIcon(category: string) {
  return categoryMap[category] || CircleDashed;
}
