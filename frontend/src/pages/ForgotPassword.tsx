import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard, AuthMessage } from "../components/auth/AuthCard";
import { AuthField, AuthSubmit } from "../components/auth/AuthField";

const API_URL = import.meta.env.VITE_API_URL;

type Status = "idle" | "sending" | "sent" | "failed";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? "sent" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <AuthCard>
      <h2 className="mb-2 text-lg font-extrabold">Glömt lösenordet?</h2>

      {status === "sent" ? (
        // Samma besked oavsett om adressen finns, precis som API:t
        <AuthMessage tone="info">
          Om det finns ett konto för {email} har vi skickat ett mejl med en länk.
          Länken gäller i en timme. Hittar du inget, titta i skräpposten.
        </AuthMessage>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Skriv in din e-post så skickar vi en länk där du kan välja ett nytt lösenord.
          </p>

          {status === "failed" && (
            <AuthMessage tone="danger">
              Det gick inte att skicka just nu. Vänta en stund och försök igen.
            </AuthMessage>
          )}

          <AuthField label="E-post" type="email" value={email} onChange={setEmail} autoComplete="email" />

          <AuthSubmit pending={status === "sending"}>
            {status === "sending" ? "Skickar..." : "Skicka länk"}
          </AuthSubmit>
        </form>
      )}

      <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-[var(--color-mint)]">
        Tillbaka till inloggningen
      </Link>
    </AuthCard>
  );
}
