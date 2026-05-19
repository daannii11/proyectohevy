import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import RoutineDetailPage from "./pages/RoutineDetailPage.jsx";
import RoutinesPage from "./pages/RoutinesPage.jsx";

const THEME_STORAGE_KEY = "workout-theme";

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return "light";
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  return (
    <Routes>
      <Route
        element={<AppShell theme={theme} onToggleTheme={handleToggleTheme} />}
      >
        <Route index element={<RoutinesPage />} />
        <Route path="routines/:routineId" element={<RoutineDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
