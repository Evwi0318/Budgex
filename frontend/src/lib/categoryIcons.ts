import {
  Home,
  ShoppingCart,
  Utensils,
  Bus,
  Dumbbell,
  Tv,
  Repeat,
  CircleDashed,
  Umbrella,
  GraduationCap,
  Receipt,
  Plane,
} from "lucide-react";

const categoryMap: Record<string, typeof Home> = {
  Boende: Home,
  Mat: ShoppingCart,
  Restaurang: Utensils,
  Transport: Bus,
  Träning: Dumbbell,
  Streaming: Tv,
  Prenumeration: Repeat,
  Övrigt: CircleDashed,
  Buffert: Umbrella,
  Studier: GraduationCap,
  CSN: GraduationCap,
  Räkningar: Receipt,
  Resa: Plane,
};

export function getCategoryIcon(category: string) {
  return categoryMap[category] || CircleDashed;
}
