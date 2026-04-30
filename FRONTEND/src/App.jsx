import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/workouts";

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("No se pudieron cargar los workouts.");
        }

        const data = await response.json();
        setWorkouts(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  return (
    <main className="app">
      <h1>Gym Workouts</h1>

      {loading && <p>Cargando workouts...</p>}
      {error && <p className="error">{error}</p>}

      {!loading &&
        !error &&
        workouts.map((workout) => (
          <section key={workout.id} className="workout-card">
            <h2>{workout.name}</h2>
            <ul>
              {workout.exercises.map((exercise) => (
                <li key={`${workout.id}-${exercise.name}`}>
                  <strong>{exercise.name}</strong> - {exercise.sets} sets x{" "}
                  {exercise.reps} reps
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}

export default App;
