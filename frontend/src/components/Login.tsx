import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { EmailNotConfirmedError } from "../context/AuthContext";
import { AuthCard, AuthMessage } from "./auth/AuthCard";
import { AuthField, AuthSubmit } from "./auth/AuthField";

const API_URL = import.meta.env.VITE_API_URL;

const modes = [
  { id: "login", label: "Logga in" },
  { id: "register", label: "Registrera" },
] as const;

type Mode = (typeof modes)[number]["id"];

type Pending = "form" | "demo" | null;

// API:t svarar med { message } vid konflikt och { errors } vid ogiltigt
// lösenord — båda ska bli en läsbar rad
function readError(body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const { message, errors } = body as { message?: string; errors?: string[] };
    if (message) return message;
    if (errors?.length) return errors.join(" ");
  }
  return "Något gick fel. Försök igen.";
}

export function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [pending, setPending] = useState<Pending>(null);

  const { setAuth, signIn, isAuthenticated } = useAuth();

  // Återställning finns bara när API:t har en e-posttjänst
  const { data: options } = useQuery({
    queryKey: ["auth-options"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/auth/options`);
      return (await response.json()) as { passwordReset: boolean };
    },
    staleTime: Infinity,
  });

  // Byte av flik börjar om från tomt: annars ligger e-post, lösenord och ett
  // felmeddelande från inloggningen kvar i registreringsformuläret, och tvärtom.
  const chooseMode = (next: Mode) => {
    if (next === mode) return;

    setMode(next);
    setEmail("");
    setPassword("");
    setError("");
    setNotice("");
    setUnconfirmed(false);
  };

  const post = (path: string) =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

  async function handleDemo() {
    setError("");
    setPending("demo");

    try {
      const response = await fetch(`${API_URL}/api/auth/demo`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Demot kunde inte startas. Försök igen.");

      const { accessToken, email: demoEmail } = await response.json();
      setAuth(accessToken, demoEmail);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nätverksfel. Kontrollera anslutningen."
      );
      setPending(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setUnconfirmed(false);
    setPending("form");

    try {
      // Register ger ingen token — den skapar bara kontot, så vi
      // loggar in direkt efteråt med samma uppgifter. Med e-postverifiering
      // svarar API:t 202 och kontot väntar i stället på länken i mejlet.
      if (mode === "register") {
        const registered = await post("/api/auth/register");
        if (!registered.ok) throw new Error(readError(await registered.json()));

        if (registered.status === 202) {
          setMode("login");
          setPassword("");
          setNotice(readError(await registered.json()));
          setPending(null);
          return;
        }
      }

      await signIn(email, password);
    } catch (err) {
      setUnconfirmed(err instanceof EmailNotConfirmedError);
      setError(
        err instanceof Error
          ? err.message
          : "Nätverksfel. Kontrollera anslutningen."
      );
      setPending(null);
    }
  }

  async function resendConfirmation() {
    setError("");
    setUnconfirmed(false);

    await fetch(`${API_URL}/api/auth/resend-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => undefined);

    setNotice("Om kontot väntar på bekräftelse har vi skickat en ny länk. Den gäller i en timme.");
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthCard>
        <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
          {modes.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => chooseMode(id)}
              className={`flex-1 py-2 font-semibold transition ${
                mode === id
                  ? "text-[var(--color-mint)] border-b-2 border-[var(--color-mint)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {notice && <AuthMessage tone="info">{notice}</AuthMessage>}
        {error && (
          <AuthMessage tone="danger">
            {error}
            {unconfirmed && (
              <button
                type="button"
                onClick={resendConfirmation}
                className="mt-2 block font-semibold underline"
              >
                Skicka länken igen
              </button>
            )}
          </AuthMessage>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="E-post"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <AuthField
            label="Lösenord"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {mode === "login" && options?.passwordReset && (
            <Link
              to="/forgot-password"
              className="block text-right text-sm font-semibold text-[var(--color-mint)]"
            >
              Glömt lösenordet?
            </Link>
          )}

          <AuthSubmit pending={pending !== null}>
            {pending === "form" ? "Laddar..." : (modes.find((m) => m.id === mode)?.label ?? "")}
          </AuthSubmit>
        </form>

        <div className="flex items-center gap-3 my-6 text-[var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-sm">eller</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={pending !== null}
          className="w-full border border-[var(--color-mint)] text-[var(--color-mint)] font-bold py-2 rounded-[var(--radius-pill)] transition hover:bg-[var(--color-mint-wash)] disabled:opacity-50"
        >
          {pending === "demo" ? "Startar demo..." : "Testa demo"}
        </button>

        <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
          Ett tillfälligt konto med en ifylld budget. Ingen registrering.
        </p>
    </AuthCard>
  );
}
