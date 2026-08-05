import { useCallback } from "react";
import { useAuth } from "./useAuth.ts";

export function useApi() {
  const { accessToken, setAuth, logout } = useAuth();

  const request = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});

      // Lägg till access token om vi har en
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      headers.set("Content-Type", "application/json");

      let response = await fetch(url, { ...options, headers });

      // Om 401 (token utgick) — försök att refresha
      if (response.status === 401 && accessToken) {
        const refreshResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include", // Skicka refresh token-cookie
          },
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAuth(data.accessToken, ""); // userId hämtas från token senare, sätts till "" för nu
          // Försök original-requesten igen med ny token
          headers.set("Authorization", `Bearer ${data.accessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh misslyckades — logga ut
          logout();
          throw new Error("Unauthorized");
        }
      }

      return response;
    },
    [accessToken, setAuth, logout],
  );

  return { request };
}
