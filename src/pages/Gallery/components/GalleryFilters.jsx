import { motion } from "framer-motion";
import {
  Images,
  Heart,
  CalendarDays,
  MapPin,
} from "lucide-react";

import styles from "./GalleryFilters.module.css";

function GalleryFilters({
  filter,
  setFilter,
}) {
  const filters = [
    {
      id: "all",
      label: "All Memories",
      icon: Images,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: Heart,
    },
    {
      id: "year",
      label: "This Year",
      icon: CalendarDays,
    },
    {
      id: "location",
      label: "Places",
      icon: MapPin,
    },
  ];

  return (
    <div className={styles.container}>
      {filters.map(
        (
          item,
          index
        ) => {
          const Icon =
            item.icon;

          const active =
            filter === item.id;

          return (
            <motion.button
              key={item.id}
              className={
                active
                  ? styles.active
                  : styles.button
              }
              onClick={() =>
                setFilter(
                  item.id
                )
              }
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index * 0.06,
              }}
              whileHover={{
                y: -3,
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.96,
              }}
            >
              <Icon size={18} />

              <span>
                {item.label}
              </span>
            </motion.button>
          );
        }
      )}
    </div>
  );
}

export default GalleryFilters;