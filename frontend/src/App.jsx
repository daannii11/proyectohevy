import { useEffect, useState } from "react";

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
      <h1>Exercises</h1>

      {loading && <p>Loading exercises...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.id}</td>
                <td>{exercise.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default App;
