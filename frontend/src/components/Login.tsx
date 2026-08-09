import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAuth } = useAuth();

  // Plockar ut ett läsbart felmeddelande oavsett om API:n svarar
  // med { message: "..." } eller { errors: ["...", "..."] }
  function extractErrorMessage(errorData: unknown): string {
    if (typeof errorData === "object" && errorData !== null) {
      const obj = errorData as { message?: string; errors?: string[] };
      if (obj.message) return obj.message;
      if (obj.errors && obj.errors.length > 0) return obj.errors.join(" ");
    }
    return "Något gick fel. Försök igen.";
  }

  async function login(): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ta emot refresh token-cookien
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      throw new Error("Fel e-post eller lösenord.");
    }

    const data = await response.json();
    if (!data.accessToken) {
      throw new Error("Inloggningen gav ingen token. Försök igen.");
    }

    setAuth(data.accessToken, email);
    navigate("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        // Register ger INGEN token — den skapar bara kontot.
        // Därför loggar vi in direkt efteråt.
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setError(extractErrorMessage(errorData));
          setLoading(false);
          return;
        }
      }

      await login();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nätverksfel. Kontrollera anslutningen.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-[var(--color-surface)] rounded-[var(--radius-card)] p-8">
        <h1 className="text-xl font-black text-white mb-6">Budgex</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 font-semibold transition ${
              mode === "login"
                ? "text-[var(--color-mint)] border-b-2 border-[var(--color-mint)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            Logga in
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 font-semibold transition ${
              mode === "register"
                ? "text-[var(--color-mint)] border-b-2 border-[var(--color-mint)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            Registrera
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[var(--color-danger)] bg-opacity-20 text-[var(--color-danger)] rounded-[var(--radius-card)]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--color-surface-2)] text-white border border-[var(--color-border)] rounded-[var(--radius-card)] px-3 py-2 focus:outline-none focus:border-[var(--color-mint)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-2">
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-surface-2)] text-white border border-[var(--color-border)] rounded-[var(--radius-card)] px-3 py-2 focus:outline-none focus:border-[var(--color-mint)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-mint)] text-[var(--color-mint-dark)] font-bold py-2 rounded-[var(--radius-pill)] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Laddar..."
              : mode === "login"
                ? "Logga in"
                : "Registrera"}
          </button>
        </form>
      </div>
    </div>
  );
}
