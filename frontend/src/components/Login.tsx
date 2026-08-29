import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL;

const modes = [
  { id: "login", label: "Logga in" },
  { id: "register", label: "Registrera" },
] as const;

type Mode = (typeof modes)[number]["id"];

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

const inputClasses =
  "w-full bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-card)] px-3 py-2 focus:outline-none focus:border-[var(--color-mint)]";

const labelClasses = "block text-sm text-[var(--color-text-muted)] mb-2";

export function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAuth } = useAuth();

  // Byte av flik börjar om från tomt: annars ligger e-post, lösenord och ett
  // felmeddelande från inloggningen kvar i registreringsformuläret, och tvärtom.
  const chooseMode = (next: Mode) => {
    if (next === mode) return;

    setMode(next);
    setEmail("");
    setPassword("");
    setError("");
  };

  const post = (path: string) =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Register ger ingen token — den skapar bara kontot, så vi
      // loggar in direkt efteråt med samma uppgifter
      if (mode === "register") {
        const registered = await post("/api/auth/register");
        if (!registered.ok) throw new Error(readError(await registered.json()));
      }

      const response = await post("/api/auth/login");
      if (!response.ok) throw new Error("Fel e-post eller lösenord.");

      const { accessToken } = await response.json();
      if (!accessToken) {
        throw new Error("Inloggningen gav ingen token. Försök igen.");
      }

      setAuth(accessToken, email);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nätverksfel. Kontrollera anslutningen."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-[var(--color-surface)] rounded-[var(--radius-card)] p-8">
        <h1 className="text-xl font-black text-[var(--color-text)] mb-6">Budgex</h1>

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

        {error && (
          <div className="mb-4 p-3 bg-[var(--color-danger-wash)] text-[var(--color-danger)] rounded-[var(--radius-card)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className={labelClasses}>E-post</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
            />
          </label>

          <label className="block">
            <span className={labelClasses}>Lösenord</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-mint)] text-[var(--color-on-mint)] font-bold py-2 rounded-[var(--radius-pill)] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Laddar..." : modes.find((m) => m.id === mode)?.label}
          </button>
        </form>
      </div>
    </div>
  );
}
