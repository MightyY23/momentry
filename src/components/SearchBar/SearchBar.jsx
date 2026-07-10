import styles from "./SearchBar.module.css";

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default SearchBar;