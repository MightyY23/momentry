import {
  Search,
  Heart,
  LocateFixed,
  Compass,
} from "lucide-react";

import { motion } from "framer-motion";

import styles from "./MapControls.module.css";

function MapControls({
  search,
  setSearch,
  favoritesOnly,
  setFavoritesOnly,
  onLocate,
  onFitAll,
}) {
  return (
    <motion.div
      className={styles.controls}
      initial={{
        opacity:0,
        y:-20
      }}
      animate={{
        opacity:1,
        y:0
      }}
    >
      <div className={styles.searchBox}>
        <Search size={18}/>

        <input
          value={search}
          onChange={(e)=>
            setSearch(e.target.value)
          }
          placeholder="Search memories..."
        />
      </div>

      <button
        className={
          favoritesOnly
            ? styles.active
            : ""
        }
        onClick={()=>
          setFavoritesOnly(
            !favoritesOnly
          )
        }
      >
        <Heart size={18}/>
      </button>

      <button onClick={onLocate}>
        <LocateFixed size={18}/>
      </button>

      <button onClick={onFitAll}>
        <Compass size={18}/>
      </button>
    </motion.div>
  );
}

export default MapControls;