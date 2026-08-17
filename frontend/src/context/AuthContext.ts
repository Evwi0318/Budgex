import { createContext } from "react";

export interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  setAuth: (accessToken: string, userEmail: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Ligger i en egen fil utan komponenter, annars tappar Vite
// hot reload för allt som importerar den
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
