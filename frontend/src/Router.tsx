import { createBrowserRouter } from "react-router-dom";
import { Login } from "./components/Login";
import { PrivateRoute } from "./components/PrivateRoute";
import { AppShell } from "./components/layout/AppShell";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // Allt under "/" ligger bakom inloggning och delar samma skal, som håller
    // månaden och vald flik. /savings finns kvar för gamla bokmärken och
    // skickas vidare till "/" av AppShell med sparandefliken vald.
    path: "/",
    element: (
      <PrivateRoute>
        <AppShell />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "savings", element: <Home /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);
