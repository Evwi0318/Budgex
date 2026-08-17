import { useState } from "react";
import { Button } from "../ui/Button";
import { NumberField } from "../ui/NumberField";
import { getCategoryIcon } from "../../lib/categoryIcons";
import { useAddExpenseMutation } from "../../hooks/useExpensesMutation";

// Kategorier som är rimliga för utgifter — sparrelaterade ikoner
// (Buffert m.fl.) hör hemma i sparkonto-flödet, inte här
const expenseCategories = [
  "Boende",
  "Mat",
  "Restaurang",
  "Transport",
  "Träning",
  "Streaming",
  "Prenumeration",
  "Räkningar",
  "Resa",
  "Övrigt",
];

interface AddExpenseFormProps {
  monthId: string;
  onSaved: () => void;
}

export function AddExpenseForm({ monthId, onSaved }: AddExpenseFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Övrigt");

  const addExpense = useAddExpenseMutation(monthId);
  const canSave = name.trim().length > 0 && amount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    addExpense.mutate(
      { name: name.trim(), amount, category },
      { onSuccess: onSaved }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-[17px] font-extrabold text-[var(--color-text)]">
        Ny utgift
      </h2>

      <label className="block">
        <span className="block text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-2">
          Namn
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hyra"
          className="w-full h-12 px-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-card)] text-[15px] font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-mint)] placeholder:text-[var(--color-text-faint)] placeholder:font-normal"
        />
      </label>

      <NumberField label="Belopp" value={amount} onChange={setAmount} />

      <div>
        <span className="block text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-2">
          Kategori
        </span>
        <div className="grid grid-cols-4 gap-2">
          {expenseCategories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const isSelected = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-[var(--radius-chip)] transition ${
                  isSelected
                    ? "bg-[var(--color-mint-wash)] text-[var(--color-mint)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className="text-[10px] font-semibold">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {addExpense.isError && (
        <p className="text-sm text-[var(--color-danger)]">
          Kunde inte spara utgiften. Försök igen.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSave || addExpense.isPending}
      >
        {addExpense.isPending ? "Sparar" : "Lägg till utgift"}
      </Button>
    </form>
  );
}
