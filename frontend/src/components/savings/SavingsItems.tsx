import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "../ui/Label";
import { SheetActions } from "../ui/SheetActions";
import { formatKr, getMonthName } from "../../lib/format";
import { parseAmount } from "../../lib/amount";
import { monthlyFromItems } from "../../lib/savings";
import type { SavingsItem } from "../../hooks/useSavingsQuery";

const field =
  "h-10 w-full min-w-0 rounded-xl bg-[var(--color-bg)] px-3 text-[14px] font-bold outline-none placeholder:font-semibold placeholder:text-[var(--color-text-faint)]";

interface SavingsItemsProps {
  items: SavingsItem[];
  onChange: (items: SavingsItem[]) => void;
}

export function SavingsItems({ items, onChange }: SavingsItemsProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [yearlyAmount, setYearlyAmount] = useState(0);
  const [dueMonth, setDueMonth] = useState(1);

  const yearly = items.reduce((sum, item) => sum + item.yearlyAmount, 0);

  const close = () => {
    setAdding(false);
    setName("");
    setYearlyAmount(0);
  };

  const add = () => {
    onChange([...items, { name: name.trim(), yearlyAmount, dueMonth }]);
    close();
  };

  return (
    <div>
      <Label>Vad sparar du till? (valfritt)</Label>

      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-2)] py-2.5 pl-3.5 pr-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">
                {item.name}
              </span>
              <span className="block text-[11.5px] text-[var(--color-text-muted)]">
                {formatKr(item.yearlyAmount)}/år · dras i{" "}
                {getMonthName(item.dueMonth)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label={`Ta bort ${item.name}`}
              className="grid h-8 w-8 place-items-center text-[var(--color-text-faint)]"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="mt-1.5 space-y-2 rounded-xl bg-[var(--color-surface-2)] p-2.5">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            placeholder="t.ex. Hemförsäkring"
            aria-label="Postens namn"
            className={field}
          />
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={yearlyAmount || ""}
              onChange={(event) =>
                setYearlyAmount(parseAmount(event.target.value))
              }
              placeholder="kr per år"
              aria-label="Belopp per år"
              className={`${field} tabular-nums`}
            />
            <select
              value={dueMonth}
              onChange={(event) => setDueMonth(Number(event.target.value))}
              aria-label="Dras i"
              className={field}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>
          <SheetActions
            onCancel={close}
            onSave={add}
            saveLabel="Lägg till post"
            disabled={!name.trim() || yearlyAmount <= 0}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1.5 h-10 w-full rounded-xl border-[1.5px] border-dashed border-[var(--color-border)] text-[13px] font-bold text-[var(--color-mint)]"
        >
          + Ny post
        </button>
      )}

      {items.length > 0 && (
        <p className="mt-2 text-[12px] font-semibold text-[var(--color-text-muted)]">
          {formatKr(yearly)}/år ÷ 12 ={" "}
          <b className="font-extrabold text-[var(--color-mint)]">
            {formatKr(monthlyFromItems(items))}/mån
          </b>
        </p>
      )}
    </div>
  );
}
