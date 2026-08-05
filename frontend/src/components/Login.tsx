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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? `${import.meta.env.VITE_API_URL}/api/auth/login`
          : `${import.meta.env.VITE_API_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Skicka refresh token-cookie
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Something went wrong");
        setLoading(false);
        return;
      }

      const data = await response.json();
      // data.accessToken och data.refreshTokenExpiresAt kommer från API:n
      setAuth(data.accessToken, email); // userId sätts till email för nu (idealt skulle vi dekoda JWT)
      navigate("/");
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          Budgex
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--color-surface-hover)]">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 font-semibold transition ${
              mode === "login"
                ? "text-[var(--color-mint)] border-b-2 border-[var(--color-mint)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Logga in
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 font-semibold transition ${
              mode === "register"
                ? "text-[var(--color-mint)] border-b-2 border-[var(--color-mint)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Registrera
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-[var(--color-text-danger)] rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--color-background)] text-[var(--color-text-primary)] border border-[var(--color-surface-hover)] rounded px-3 py-2 focus:outline-none focus:border-[var(--color-mint)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-background)] text-[var(--color-text-primary)] border border-[var(--color-surface-hover)] rounded px-3 py-2 focus:outline-none focus:border-[var(--color-mint)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-mint)] text-black font-semibold py-2 rounded transition hover:opacity-90 disabled:opacity-50"
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
