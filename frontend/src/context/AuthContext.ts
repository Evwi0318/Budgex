import { createContext } from "react";

export interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  setAuth: (accessToken: string, userEmail: string) => void;
  /** Kastar ett Error med ett meddelande som kan visas för användaren */
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  /** Sant tills vi vet om refresh-cookien ger en giltig session */
  isRestoring: boolean;
}

// Ligger i en egen fil utan komponenter, annars tappar Vite
// hot reload för allt som importerar den
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/** Rätt lösenord, men kontot väntar på att e-posten bekräftas */
export class EmailNotConfirmedError extends Error {}
