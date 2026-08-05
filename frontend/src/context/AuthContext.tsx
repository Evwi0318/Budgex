import { createContext, useState } from "react";
import type { ReactNode } from "react";

export interface AuthContextType {
  accessToken: string | null;
  userId: string | null;
  setAuth: (accessToken: string, userId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSetAuth = (token: string, id: string) => {
    setAccessToken(token);
    setUserId(id);
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserId(null);
  };

  const value: AuthContextType = {
    accessToken,
    userId,
    setAuth: handleSetAuth,
    logout: handleLogout,
    isAuthenticated: accessToken !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
