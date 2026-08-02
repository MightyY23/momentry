import { motion } from "framer-motion";

import styles from "./Hero.module.css";

function Hero({ moments }) {

    const places =
        new Set(
            moments
                .filter(
                    m => m.location
                )
                .map(
                    m => m.location
                )
        ).size;

    return (

        <motion.div

            className={styles.hero}

            initial={{
                opacity:0,
                y:30
            }}

            animate={{
                opacity:1,
                y:0
            }}

        >

            <h1>

                ❤️ Your Journey

            </h1>

            <p>

                You've created

                <strong>

                    {" "}
                    {moments.length}

                </strong>

                {" "}beautiful memories

                across

                <strong>

                    {" "}
                    {places}

                </strong>

                {" "}places.

            </p>

        </motion.div>

    );

}

export default Hero;