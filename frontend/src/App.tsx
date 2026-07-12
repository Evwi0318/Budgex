import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [health, setHealth] = useState<string>("Loading...");

  useEffect(() => {
    fetch("http://localhost:5160/api/health")
      .then((response) => response.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth("Could not reach API"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <h1 className="text-3xl font-bold text-green-500">
        API status: {health}
      </h1>
    </div>
  );
}

export default App;
