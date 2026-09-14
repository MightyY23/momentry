import { motion } from "framer-motion";
import {
  Images,
  Heart,
  CalendarDays,
  MapPin,
  Camera,
} from "lucide-react";

import styles from "./GalleryFilters.module.css";

function GalleryFilters({
  filter,
  setFilter,
  year,
  setYear,
  years = [],
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
      label: "By Year",
      icon: CalendarDays,
    },
    {
      id: "photos",
      label: "With Photos",
      icon: Camera,
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

      {filter === "year" &&
        years.length > 0 && (
          <select
            className={styles.yearSelect}
            value={year}
            onChange={(e) =>
              setYear(
                Number(e.target.value)
              )
            }
          >
            {years.map((y) => (
              <option
                key={y}
                value={y}
              >
                {y}
              </option>
            ))}
          </select>
        )}
    </div>
  );
}

export default GalleryFilters;