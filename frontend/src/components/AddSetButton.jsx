function AddSetButton({ onAddSet }) {
  return (
    <button type="button" className="add-button" onClick={onAddSet}>
      + Add set
    </button>
  );
}

export default AddSetButton;
