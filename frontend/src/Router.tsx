import { createBrowserRouter } from "react-router-dom";
import { Login } from "./components/Login";
import { PrivateRoute } from "./components/PrivateRoute";
import { AppShell } from "./components/layout/AppShell";

// Placeholder för Home-skärm (kommer senare med riktiga data)
function Home() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-4">Hem</h1>
      <p className="text-[var(--color-text-muted)]">Home-skärm kommer här...</p>
    </div>
  );
}

// Placeholder för Sparande-skärm
function Savings() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-4">Sparande</h1>
      <p className="text-[var(--color-text-muted)]">
        Sparande-skärm kommer här...
      </p>
    </div>
  );
}

// Placeholder för Profil-skärm
function Profile() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-4">Profil</h1>
      <p className="text-[var(--color-text-muted)]">
        Profil-skärm kommer här...
      </p>
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
        <AppShell />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "savings",
        element: <Savings />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
]);
