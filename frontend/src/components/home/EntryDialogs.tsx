import { AddEntryForm } from "./AddEntryForm";
import { EditEntryForm } from "./EditEntryForm";
import { BottomSheet } from "../ui/BottomSheet";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { UndoToast } from "../ui/UndoToast";
import { getMonthName } from "../../lib/format";
import type { EntryEditor } from "../../hooks/useEntryEditor";

const nounOf = (kind: string | undefined) =>
  kind === "Income" ? "Inkomsten" : "Utgiften";

export function EntryDialogs({ editor }: { editor: EntryEditor }) {
  const {
    year,
    month,
    adding,
    editing,
    removing,
    pending,
    undo,
    closeAdd,
    closeEdit,
    confirmRemove,
    addDirty,
    setAddDirty,
    addDiscarding,
    setAddDiscarding,
    editDirty,
    setEditDirty,
    discarding,
    setDiscarding,
    setRemoving,
    requestRemove,
  } = editor;

  const monthName = getMonthName(month);

  return (
    <>
      <BottomSheet
        open={adding !== null}
        onClose={() => (addDirty ? setAddDiscarding(true) : closeAdd())}
      >
        {adding && (
          <AddEntryForm
            year={year}
            month={month}
            kind={adding}
            onSaved={closeAdd}
            onDirtyChange={setAddDirty}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={addDiscarding}
        title="Kasta ändringarna?"
        body={`Den nya ${adding === "Income" ? "inkomsten" : "utgiften"} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) => (index === 0 ? closeAdd() : setAddDiscarding(false))}
        onCancel={() => setAddDiscarding(false)}
      />

      <BottomSheet
        open={editing !== null}
        onClose={() => (editDirty ? setDiscarding(true) : closeEdit())}
      >
        {editing && (
          <EditEntryForm
            year={year}
            month={month}
            entry={editing}
            onSaved={closeEdit}
            onRemove={() => requestRemove(editing)}
            onDirtyChange={setEditDirty}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={discarding}
        title="Kasta ändringarna?"
        body={`Ändringarna av ${editing?.name ?? ""} sparas inte.`}
        actions={[
          { label: "Kasta", tone: "danger" },
          { label: "Fortsätt skriva", tone: "alt" },
        ]}
        onPick={(index) => (index === 0 ? closeEdit() : setDiscarding(false))}
        onCancel={() => setDiscarding(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Ta bort ${removing?.name ?? ""}?`}
        body={`${nounOf(removing?.kind)} återkommer varje månad.`}
        actions={[
          { label: `Bara ${monthName} ${year}` },
          { label: "Den här och kommande månader", tone: "alt" },
        ]}
        cancelLabel="Avbryt"
        onPick={(index) => confirmRemove(index === 0 ? "Month" : "Onwards")}
        onCancel={() => setRemoving(null)}
      />

      <UndoToast
        message={
          pending
            ? `${nounOf(pending.entry.kind)} ${pending.entry.name} borttagen`
            : null
        }
        onUndo={undo}
      />
    </>
  );
}
