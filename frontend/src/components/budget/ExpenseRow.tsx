import { Trash2 } from "lucide-react";
import { Card } from "../ui/Card";
import { Amount } from "../ui/Amount";
import { IconChip } from "../ui/IconChip";
import { getCategoryIcon } from "../../lib/categoryIcons";

interface ExpenseRowProps {
  id: string;
  name: string;
  amount: number;
  category: string;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ExpenseRow({
  id,
  name,
  amount,
  category,
  onDelete,
  isDeleting = false,
}: ExpenseRowProps) {
  const Icon = getCategoryIcon(category);

  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <IconChip icon={Icon} />
        <span className="text-[15px] font-semibold text-[var(--color-text)] truncate">
          {name}
        </span>
      </div>

      <div className="flex items-center gap-3 ml-4 shrink-0">
        <Amount value={amount} tone="negative" />
        <button
          onClick={() => onDelete(id)}
          disabled={isDeleting}
          className="flex items-center justify-center w-8 h-8 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition disabled:opacity-50"
          aria-label="Ta bort utgift"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </Card>
  );
}
