import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth();

  // Utan den här väntan skickas man till inloggningen varje omladdning,
  // innan refresh-cookien hunnit svara
  if (isRestoring) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
