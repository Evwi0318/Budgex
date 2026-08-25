import { useState } from "react";
import { SwipeRow } from "./SwipeRow";
import { categoryOf } from "../../lib/categories";
import { formatKr } from "../../lib/format";
import type { PlannedEntry } from "../../hooks/useMonthPlanQuery";

interface EntryRowProps {
  entry: PlannedEntry;
  monthName: string;
  locked: boolean;
  refocusAmount: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
  onAmountCommit: (amount: number) => void;
  onAmountRefocused: () => void;
}

export function EntryRow({
  entry,
  monthName,
  locked,
  refocusAmount,
  onOpen,
  onDelete,
  onTogglePaid,
  onAmountCommit,
  onAmountRefocused,
}: EntryRowProps) {
  const category = categoryOf(entry.kind, entry.category);
  const isExpense = entry.kind === "Expense";
  const paid = isExpense && !entry.isAutogiro && entry.isPaid;

  const note = entry.isAutogiro
    ? "Autogiro · Varje månad"
    : entry.repeats
      ? "Varje månad"
      : `Bara ${monthName}`;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(entry.amount));
  const [savedAmount, setSavedAmount] = useState(entry.amount);

  // Utkastet nollställs bara när det sparade beloppet faktiskt ändrats.
  // Under en öppen omfattningsdialog står entry.amount stilla, och då ska
  // det man skrivit ligga kvar — inte ersättas av det gamla värdet.
  if (savedAmount !== entry.amount) {
    setSavedAmount(entry.amount);
    setDraft(String(entry.amount));
  }

  const showInput = (editing || refocusAmount) && !locked;

  const commit = () => {
    setEditing(false);

    const digits = draft.replace(/\D/g, "");

    if (digits === "") {
      setDraft(String(entry.amount));
      return;
    }

    const value = Number(digits);
    if (value !== entry.amount) onAmountCommit(value);
  };

  const amountTone = entry.kind === "Income" ? "text-[var(--color-mint)]" : "";

  return (
    <SwipeRow onDelete={onDelete} disabled={locked}>
      <div className="flex items-center gap-3 bg-[var(--color-surface)] px-3.5 py-2.5">
        {isExpense &&
          (entry.isAutogiro ? (
            <span
              title="Autogiro"
              className="grid w-[26px] shrink-0 place-items-center text-[14px] text-[var(--color-mint-dim)]"
            >
              ↻
            </span>
          ) : (
            <button
              onClick={onTogglePaid}
              disabled={locked}
              aria-pressed={entry.isPaid}
              aria-label={
                entry.isPaid ? "Markera som obetald" : "Markera som betald"
              }
              className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-[14px] font-black transition ${
                entry.isPaid
                  ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-[var(--color-on-mint)]"
                  : "border-[var(--color-border)] text-transparent"
              }`}
            >
              ✓
            </button>
          ))}

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-mint-wash)] text-[17px]">
          {category.emoji}
        </span>

        <button
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
          aria-label={`Öppna ${entry.name}`}
        >
          <span
            className={`block truncate text-[15px] font-bold ${
              paid ? "line-through decoration-[var(--color-text-faint)] opacity-50" : ""
            }`}
          >
            {entry.name}
          </span>
          <span className="mt-px block text-[11.5px] text-[var(--color-text-faint)]">
            {note}
          </span>
        </button>

        {showInput ? (
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            autoFocus
            onFocus={(event) => {
              setEditing(true);
              onAmountRefocused();
              event.target.select();
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
                return;
              }

              if (event.key === "Escape") {
                setDraft(String(entry.amount));
                setEditing(false);
              }
            }}
            aria-label={`Belopp för ${entry.name}`}
            className={`w-[84px] shrink-0 rounded-lg bg-[var(--color-surface-2)] px-2 py-0.5 text-right text-[15px] font-extrabold tabular-nums outline-none ring-1 ring-[var(--color-mint-dim)] ${amountTone}`}
          />
        ) : (
          <button
            onClick={() => !locked && setEditing(true)}
            disabled={locked}
            aria-label={`Ändra beloppet för ${entry.name}`}
            className={`shrink-0 text-[15px] font-extrabold tabular-nums ${amountTone} ${
              paid ? "opacity-50" : ""
            }`}
          >
            {formatKr(entry.amount)}
          </button>
        )}

        <button
          onClick={onOpen}
          aria-label="Öppna"
          className={`shrink-0 pl-0.5 text-[17px] text-[var(--color-text-faint)] ${
            locked ? "opacity-40" : ""
          }`}
        >
          ›
        </button>
      </div>
    </SwipeRow>
  );
}
