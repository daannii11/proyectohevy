import { useState } from "react";

function AddExerciseForm({ onAddExercise }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);

    try {
      await onAddExercise(trimmedName);
      setName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="exercise-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="New exercise name"
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

export default AddExerciseForm;
