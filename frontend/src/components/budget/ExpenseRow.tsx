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
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 flex-1">
        <IconChip icon={Icon} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {name}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Amount value={amount} tone="negative" size="sm" />
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
