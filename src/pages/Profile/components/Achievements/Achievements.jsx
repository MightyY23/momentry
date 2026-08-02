import { useEffect } from "react";

import AchievementCard from "./AchievementCard";

import styles from "./Achievements.module.css";

import { getAchievements } from "../../../../services/achievement/achievementEngine";

import useNotification from "../../../../hooks/useNotification";

function Achievements({ moments }) {
  //---------------------------------------

  const {
    achievements,
    newlyUnlocked,
  } = getAchievements(
    moments || []
  );

  const { notify } =
    useNotification();

  //---------------------------------------
  // Notify New Achievements
  //---------------------------------------

  useEffect(() => {
    newlyUnlocked.forEach(
      (achievement) => {
        notify.achievement(
          achievement.title
        );
      }
    );
  }, [newlyUnlocked, notify]);

  //---------------------------------------

  return (
    <section className={styles.section}>
      <h2>🏆 Achievements</h2>

      <div className={styles.grid}>
        {achievements.map(
          (
            achievement,
            index
          ) => (
            <AchievementCard
              key={
                achievement.id
              }
              achievement={
                achievement
              }
              delay={
                index * 0.08
              }
            />
          )
        )}
      </div>
    </section>
  );
}

export default Achievements;