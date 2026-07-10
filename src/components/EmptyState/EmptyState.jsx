import Button from "../../ui/Button/Button";
import styles from "./EmptyState.module.css";

function EmptyState({ onAddMoment }) {
  return (
    <div className={styles.emptyCard}>
      <h2>No moments yet</h2>

      <p>
        Every beautiful story begins
        <br />
        with a single memory.
      </p>

      <Button onClick={onAddMoment}>
        Add Your First Moment
      </Button>
    </div>
  );
}

export default EmptyState;