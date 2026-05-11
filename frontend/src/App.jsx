import { useEffect, useState } from "react";
import ExerciseCard from "./components/ExerciseCard.jsx";

const API_URL = "http://localhost:3000/exercises";

function App() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="container">
      <h1>Workout Tracker</h1>

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
    </main>
  );
}

export default App;
