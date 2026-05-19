import { Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";

function AppShell({ theme, onToggleTheme }) {
  return (
    <main className={`app-shell theme-${theme}`}>
      <section className="container">
        <header className="app-header">
          <h1>Workout Tracker</h1>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </header>
        <Outlet />
      </section>
    </main>
  );
}

export default AppShell;
