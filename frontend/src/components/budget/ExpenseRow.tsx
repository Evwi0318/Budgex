import { Trash2 } from "lucide-react";
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
    // Egen yta i stället för Card: en rad är 56px (chip 40px + 8px padding),
    // Cards standardpadding hade gjort den 72px
    <div className="flex items-center justify-between h-14 p-2 bg-[var(--color-surface)] rounded-[var(--radius-card)]">
      <div className="flex items-center gap-3 min-w-0">
        <IconChip icon={Icon} />
        <span className="text-[15px] font-semibold text-[var(--color-text)] truncate">
          {name}
        </span>
      </div>

      <div className="flex items-center gap-1 ml-3 shrink-0">
        {/* Neutralt vitt — rosa-rött är reserverat för statparet och negativt saldo */}
        <Amount value={amount} />
        <button
          onClick={() => onDelete(id)}
          disabled={isDeleting}
          className="flex items-center justify-center w-10 h-10 text-[var(--color-text-faint)] hover:text-[var(--color-danger-strong)] transition disabled:opacity-50"
          aria-label={`Ta bort ${name}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}
