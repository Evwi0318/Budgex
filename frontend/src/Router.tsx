import { createBrowserRouter } from "react-router-dom";
import { Login } from "./components/Login";
import { PrivateRoute } from "./components/PrivateRoute";

// Placeholder för Home-skärm (kommer senare)
function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] p-4">
      <h1 className="text-3xl font-bold mb-4">Hem</h1>
      <p>Home-skärm kommer här...</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <Home />
      </PrivateRoute>
    ),
  },
]);
