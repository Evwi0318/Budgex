import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL;

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

  const request = async <T>(path: string, options: RequestInit = {}) => {
    const send = (token: string | null) => {
      const headers = new Headers(options.headers);
      headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(`${API_URL}${path}`, { ...options, headers });
    };

    let response = await send(accessToken);

    if (response.status === 401 && accessToken) {
      const refreshed = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshed.ok) {
        logout();
        throw new Error("Sessionen har gått ut. Logga in igen.");
      }

      const { accessToken: newToken } = await refreshed.json();
      setAuth(newToken, userEmail ?? "");
      response = await send(newToken);
    }

    if (!response.ok) {
      throw new Error(`${options.method ?? "GET"} ${path} gav ${response.status}`);
    }

    return response.status === 204 ? (null as T) : ((await response.json()) as T);
  };

  return { request };
}
