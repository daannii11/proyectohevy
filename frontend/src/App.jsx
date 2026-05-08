import { useEffect, useState } from "react";
import AddExerciseForm from "./components/AddExerciseForm.jsx";
import ExerciseTable from "./components/ExerciseTable.jsx";

const API_URL = "http://localhost:3000/exercises";

function App() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

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

  async function handleAddExercise(name) {
    setSubmitError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const createdExercise = await response.json();
      setExercises((currentExercises) => [...currentExercises, createdExercise]);
    } catch (err) {
      setSubmitError("Could not create exercise.");
      console.error(err);
    }
  }

  return (
    <main className="container">
      <h1>Exercises</h1>
      <AddExerciseForm onAddExercise={handleAddExercise} />
      {submitError && <p>{submitError}</p>}

      {loading && <p>Loading exercises...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && <ExerciseTable exercises={exercises} />}
    </main>
  );
}

export default App;
