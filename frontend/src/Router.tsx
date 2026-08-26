import { createBrowserRouter } from "react-router-dom";
import { Login } from "./components/Login";
import { PrivateRoute } from "./components/PrivateRoute";
import { AppShell } from "./components/layout/AppShell";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // Allt under "/" ligger bakom inloggning och delar samma skal
    // med toppbar och bottennavigering. Barnrutterna renderar inget själva
    // — de finns för att adressen ska matcha, sidorna ligger som slides
    // i AppShell så att de går att svepa emellan.
    path: "/",
    element: (
      <PrivateRoute>
        <AppShell />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <></> },
      { path: "savings", element: <></> },
      { path: "profile", element: <></> },
    ],
  },
]);
