import styles from "./ProgressBar.module.css";

function ProgressBar({
    page,
    total
}){

const progress=
(page/total)*100;


return(

<div className={styles.wrapper}>

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