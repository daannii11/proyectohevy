import { useEffect, useState } from "react";
import ExerciseCard from "./components/ExerciseCard.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

const API_URL = "http://localhost:3000/exercises";
const THEME_STORAGE_KEY = "workout-theme";

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return "light";
}

function App() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    async function fetchExercises() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setExercises(data);
      } catch (err) {
        setError("Could not load exercises.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      <section className="container">
        <header className="app-header">
          <h1>Workout Tracker</h1>
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </header>

        {loading && <p>Loading exercises...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && exercises.length === 0 && <p>No exercises found.</p>}

        {!loading && !error && exercises.length > 0 && (
          <section className="exercise-grid">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </section>
        )}
        </section>
    </main>
  );
}

export default App;
