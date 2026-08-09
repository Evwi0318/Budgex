import { useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "./AuthContext";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_ID_KEY = "userId";

/**
 * Läser ett värde ur localStorage och kastar bort skräp. Strängarna
 * "undefined" och "null" har hamnat där tidigare och får inte
 * misstas för en giltig token.
 */
function readStoredValue(key: string): string | null {
  const value = localStorage.getItem(key);
  if (!value || value === "undefined" || value === "null") {
    localStorage.removeItem(key);
    return null;
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState(() =>
    readStoredValue(ACCESS_TOKEN_KEY)
  );
  const [userId, setUserId] = useState(() => readStoredValue(USER_ID_KEY));

  // Access token ligger i localStorage så att en omladdning inte
  // loggar ut användaren. Refresh token sköts av en httpOnly-cookie
  // som JavaScript aldrig kommer åt.
  const setAuth = (token: string, id: string) => {
    if (!token) return; // en tom token får aldrig räknas som inloggad
    setAccessToken(token);
    setUserId(id);
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, id);
  };

  const logout = () => {
    setAccessToken(null);
    setUserId(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  };

  const value: AuthContextType = {
    accessToken,
    userId,
    setAuth,
    logout,
    isAuthenticated: accessToken !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
