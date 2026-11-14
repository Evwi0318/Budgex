import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard, AuthMessage } from "../components/auth/AuthCard";

const API_URL = import.meta.env.VITE_API_URL;

type Status = "checking" | "confirmed" | "invalid";

export function ConfirmEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>(email && token ? "checking" : "invalid");

  // Att bekräfta samma länk två gånger är ofarligt, så StrictModes dubbla
  // körning i utvecklingsläge behöver ingen vakt
  useEffect(() => {
    if (!email || !token) return;

    fetch(`${API_URL}/api/auth/confirm-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    })
      .then((response) => setStatus(response.ok ? "confirmed" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [email, token]);

  return (
    <AuthCard>
      <h2 className="mb-4 text-lg font-extrabold">Bekräfta e-post</h2>

      {status === "checking" && <AuthMessage tone="info">Bekräftar {email}...</AuthMessage>}
      {status === "confirmed" && (
        <AuthMessage tone="info">E-posten är bekräftad. Nu kan du logga in.</AuthMessage>
      )}
      {status === "invalid" && (
        <AuthMessage tone="danger">
          Länken är ogiltig eller har gått ut. Logga in med ditt lösenord så kan du få en ny länk.
        </AuthMessage>
      )}

      <Link
        to="/login"
        className="mt-2 block w-full rounded-[var(--radius-pill)] bg-[var(--color-mint)] py-2 text-center font-bold text-[var(--color-on-mint)]"
      >
        Till inloggningen
      </Link>
    </AuthCard>
  );
}
