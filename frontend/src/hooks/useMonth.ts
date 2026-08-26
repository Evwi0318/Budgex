import { useContext } from "react";
import { MonthContext } from "../context/MonthContext";

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error("useMonth must be used within AppShell");
  }
  return context;
}
