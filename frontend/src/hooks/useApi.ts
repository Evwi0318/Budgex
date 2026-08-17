import { useAuth } from "./useAuth";

/**
 * Fetch med access token påsatt, och automatisk förnyelse vid 401.
 *
 * Analogi: access token är armbandet du visar i entrén. Det gäller bara
 * 15 minuter. Refresh token är kvittot i fickan — när armbandet gått ut
 * går appen tillbaka till luckan, visar kvittot och får ett nytt armband,
 * utan att du behöver logga in igen.
 */
export function useApi() {
  const { accessToken, userEmail, setAuth, logout } = useAuth();

  const request = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(url, { ...options, headers });

    // Allt annat än "token har gått ut" lämnas till anroparen
    if (response.status !== 401 || !accessToken) {
      return response;
    }

    const refreshResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
      {
        method: "POST",
        credentials: "include", // refresh token ligger i en httpOnly-cookie
      }
    );

    if (!refreshResponse.ok) {
      logout();
      throw new Error("Sessionen har gått ut. Logga in igen.");
    }

    const { accessToken: newToken } = await refreshResponse.json();
    // E-posten skickas med oförändrad — refresh-svaret innehåller den
    // inte, och en tom sträng här skulle radera den ur localStorage
    setAuth(newToken, userEmail ?? "");

    headers.set("Authorization", `Bearer ${newToken}`);
    return fetch(url, { ...options, headers });
  };

  return { request };
}
