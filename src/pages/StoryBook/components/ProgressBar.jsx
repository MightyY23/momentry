import styles from "./ProgressBar.module.css";

function ProgressBar({
    page,
    total,
    compact = false
}){

const progress=
(page/total)*100;


return(

<div className={
compact ? `${styles.wrapper} ${styles.compact}` : styles.wrapper
}>

<div
className={styles.bar}
style={{
width:`${progress}%`
}}
></div>

</div>

);

}

export default ProgressBar;