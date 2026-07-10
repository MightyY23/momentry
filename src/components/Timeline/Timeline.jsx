import Button from "../../ui/Button/Button";
import MomentCard from "../MomentCard/MomentCard";

import styles from "./Timeline.module.css";
import { motion } from "framer-motion";

function Timeline({
  moments,
  onOpenMoment,
  onAddMoment,
  onToggleFavorite,
}) {
  return (
    <motion.div
      className={styles.timeline}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className={styles.heading}>
        Your Journey ❤️
      </h2>

      {moments.map((moment) => (
        <MomentCard
          key={moment.id}
          moment={moment}
          onClick={() => onOpenMoment(moment.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}

      <Button onClick={onAddMoment}>
        + Add New Chapter
      </Button>
    </motion.div>
  );
}

export default Timeline;