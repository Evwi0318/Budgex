import { SavingsRow } from "./SavingsRow";
import { SavingsForm } from "./SavingsForm";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import type { SavingsEditor } from "../../hooks/useSavingsEditor";
import type { MonthPlan } from "../../hooks/useMonthPlanQuery";
import type { SavingsMonth } from "../../hooks/useSavingsQuery";

interface SavingsListProps {
  editor: SavingsEditor;
  sources: SavingsMonth["sources"];
  locked: boolean;
}

export function SavingsList({ editor, sources, locked }: SavingsListProps) {
  return (
    <>
      {editor.visible.map((account) => (
        <SavingsRow
          key={account.id}
          account={account}
          sources={sources}
          locked={locked}
          onOpen={() => editor.openEdit(account)}
          onToggleTransfer={() =>
            editor.transfer.mutate({
              id: account.id,
              isTransferred: !account.isTransferred,
            })
          }
        />
      ))}
    </>
  );
}

interface SavingsSheetProps {
  editor: SavingsEditor;
  plan: MonthPlan;
  sources: SavingsMonth["sources"];
  year: number;
  month: number;
  monthName: string;
}

export function SavingsSheet({
  editor,
  plan,
  sources,
  year,
  month,
  monthName,
}: SavingsSheetProps) {
  const { editing, removing, sheetOpen, closeSheet, requestClose } = editor;

  return (
    <>
      <BottomSheet open={sheetOpen} onClose={requestClose}>
        {sheetOpen && (
          <SavingsForm
            year={year}
            month={month}
            account={editing}
            incomes={plan.income}
            sources={sources}
            onSaved={closeSheet}
            onCancel={requestClose}
            onRemove={() => {
              const account = editing;
              closeSheet();
              if (account) editor.setRemoving(account);
            }}
            onDirtyChange={editor.setDirty}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={editor.discarding}
        title="Kasta ändringarna?"
        body={`Ändringarna av ${editing?.name ?? "det nya sparkontot"} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) =>
          index === 0 ? closeSheet() : editor.setDiscarding(false)
        }
        onCancel={() => editor.setDiscarding(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Ta bort ${removing?.name ?? ""}?`}
        body={`Sparkontot slutar gälla från ${monthName}. Månader före behåller sitt sparande.`}
        actions={[{ label: "Ta bort", tone: "danger" }]}
        cancelLabel="Avbryt"
        onPick={editor.confirmRemove}
        onCancel={() => editor.setRemoving(null)}
      />
    </>
  );
}
