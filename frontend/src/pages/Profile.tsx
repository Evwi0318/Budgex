import { useState } from "react";
import { Link } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  IdCard,
  KeyRound,
  LogOut,
  Mail,
  Trash2,
} from "lucide-react";
import { BottomSheet } from "../components/ui/BottomSheet";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { NameForm } from "../components/profile/NameForm";
import { PasswordForm } from "../components/profile/PasswordForm";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../lib/initials";
import {
  useDeleteAccountMutation,
  useProfileQuery,
} from "../hooks/useProfileQuery";

type Sheet = "name" | "password" | null;

export function Profile() {
  const { userEmail, logout } = useAuth();
  const { data: profile } = useProfileQuery();
  const deleteAccount = useDeleteAccountMutation();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const email = profile?.email ?? userEmail ?? "";
  const name = profile?.name ?? null;

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          to="/"
          aria-label="Tillbaka"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-text-muted)] transition active:scale-95"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-xl font-extrabold">Profil</h1>
      </div>

      <div className="mb-7 flex items-center gap-3.5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[1.5px] border-[var(--color-mint-dim)] bg-[var(--color-mint-wash)] text-[19px] font-bold tracking-tight text-[var(--color-mint)]">
          {initials(name, email)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-bold tracking-[-0.02em]">
            {name ?? "Namnlös"}
          </span>
          <span className="block truncate text-[12.5px] text-[var(--color-text-muted)]">
            {email}
          </span>
        </span>
      </div>

      <Group label="Konto">
        <Row
          icon={IdCard}
          label="Namn"
          value={name ?? "Lägg till"}
          onClick={() => setSheet("name")}
        />
        {/* Adressen går inte att byta här: en ny adress måste bekräftas innan
            den ersätter den gamla, annars kan ett kapat konto låsas om. Det
            kräver e-postutskick, som appen inte har än. */}
        <Row icon={Mail} label="E-post" value={email} />
        <Row
          icon={KeyRound}
          label="Byt lösenord"
          onClick={() => setSheet("password")}
        />
      </Group>

      <Group label="Session">
        <Row icon={LogOut} label="Logga ut" onClick={logout} />
        <Row
          icon={Trash2}
          label="Ta bort konto"
          danger
          onClick={() => setConfirmingDelete(true)}
        />
      </Group>

      <BottomSheet open={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === "name" && (
          <NameForm current={name} onDone={() => setSheet(null)} />
        )}
        {sheet === "password" && <PasswordForm onDone={() => setSheet(null)} />}
      </BottomSheet>

      <ConfirmDialog
        open={confirmingDelete}
        title="Ta bort kontot?"
        body="Alla dina månader, poster och sparkonton försvinner. Det går inte att ångra."
        actions={[{ label: "Ja, ta bort allt", tone: "danger" }]}
        cancelLabel="Avbryt"
        onPick={() => deleteAccount.mutate(undefined, { onSuccess: logout })}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}


function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 px-0.5 text-[12px] font-medium text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {children}
      </div>
    </div>
  );
}

interface RowProps {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value?: string;
  danger?: boolean;
  onClick?: () => void;
}

function Row({ icon: Icon, label, value, danger = false, onClick }: RowProps) {
  const shared =
    "flex w-full items-center gap-2.5 border-t border-[var(--color-border)] px-3 py-2.5 first:border-t-0";

  const content = (
    <>
      <span
        className={`grid shrink-0 place-items-center ${
          danger ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"
        }`}
      >
        <Icon size={17} strokeWidth={2} />
      </span>

      <span
        className={`flex-1 text-left text-[14px] font-semibold tracking-[-0.015em] ${
          danger ? "text-[var(--color-danger)]" : ""
        }`}
      >
        {label}
      </span>

      {value && (
        <span className="min-w-0 truncate text-[13px] text-[var(--color-text-muted)]">
          {value}
        </span>
      )}

      {onClick && (
        <ChevronRight
          size={15}
          className="shrink-0 text-[var(--color-text-faint)]"
        />
      )}
    </>
  );

  return onClick ? (
    <button
      onClick={onClick}
      className={`${shared} active:bg-[var(--color-surface-2)]`}
    >
      {content}
    </button>
  ) : (
    <div className={shared}>{content}</div>
  );
}
