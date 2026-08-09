import { createBrowserRouter } from "react-router-dom";
import { Login } from "./components/Login";
import { PrivateRoute } from "./components/PrivateRoute";
import { AppShell } from "./components/layout/AppShell";
import { Home } from "./pages/Home";
import { Savings } from "./pages/Savings";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // Allt under "/" ligger bakom inloggning och delar samma skal
    // med toppbar och bottennavigering
    path: "/",
    element: (
      <PrivateRoute>
        <AppShell />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "savings", element: <Savings /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);
