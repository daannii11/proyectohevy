import { useEffect, useState } from "react";
import { getApiBase } from "./config/api.js";
import ExerciseList from "./components/ExerciseList.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

const EXERCISES_URL = `${getApiBase()}/exercises`;
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
        const response = await fetch(EXERCISES_URL);
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

  async function handleDeleteExercise(exerciseId) {
    const previousExercises = exercises;
    setExercises((current) =>
      current.filter((exerciseItem) => exerciseItem.id !== exerciseId)
    );

    try {
      const response = await fetch(`${EXERCISES_URL}/${exerciseId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (err) {
      console.error(err);
      setExercises(previousExercises);
      setError("Could not delete exercise. Please try again.");
    }
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
          <ExerciseList
            exercises={exercises}
            onDeleteExercise={handleDeleteExercise}
          />
        )}
        </section>
    </main>
  );
}

export default App;
