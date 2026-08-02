import { motion } from "framer-motion";
import styles from "./Card.module.css";

function Card({
  children,
  variant = "glass",
  hover = true,
  padding = "md",
  fullHeight = false,
  className = "",
  onClick,
  ...props
}) {
  const classes = [
    styles.card,
    styles[variant],
    styles[padding],
    hover ? styles.hover : "",
    fullHeight ? styles.fullHeight : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      className={classes}
      whileHover={hover ? { y: -6 } : {}}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Card;