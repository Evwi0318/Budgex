import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL;
const USER_EMAIL_KEY = "userEmail";

/**
 * Access token lever bara i minnet. Ett injicerat skript kan läsa allt i
 * localStorage, så en token som ligger där är stulen i samma sekund appen
 * får in en XSS. E-posten ligger kvar — den är inte en nyckel till något.
 *
 * Priset är att en omladdning tömmer minnet. Refresh-cookien löser det:
 * appen frågar en gång vid start om sessionen fortfarande gäller.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState(() =>
    localStorage.getItem(USER_EMAIL_KEY)
  );
  const [isRestoring, setIsRestoring] = useState(true);

  // StrictMode kör effekter två gånger i utvecklingsläge. Två samtidiga
  // förnyelser med samma cookie ser ut som ett återanvänt token, och då
  // spärrar backend hela sessionen. Vakten ser till att det bara sker en gång.
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    restoreSession()
      .then(setAccessToken)
      .finally(() => setIsRestoring(false));
  }, []);

  const setAuth = (token: string, email: string) => {
    if (!token) return;
    setAccessToken(token);
    setUserEmail(email);
    localStorage.setItem(USER_EMAIL_KEY, email);
  };

  const logout = () => {
    setAccessToken(null);
    setUserEmail(null);
    localStorage.removeItem(USER_EMAIL_KEY);
    fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  };

  const value: AuthContextType = {
    accessToken,
    userEmail,
    setAuth,
    logout,
    isAuthenticated: accessToken !== null,
    isRestoring,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Bara 401 betyder utloggad. Nätfel och kallstart får några nya försök.
async function restoreSession(attempts = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    if (response?.ok) return (await response.json()).accessToken;
    if (response?.status === 401) return null;

    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  return null;
}
