import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { router } from "./Router";

// Data som redan hämtats visas direkt när man kommer tillbaka till appen, och
// hämtas om i bakgrunden först när den hållit i en minut. Utan det börjar varje
// montering och varje fönsterfokus med ett skelett och en väntan på nätet.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
