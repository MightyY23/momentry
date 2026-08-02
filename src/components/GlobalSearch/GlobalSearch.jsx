import { useMemo, useState } from "react";

import styles from "./GlobalSearch.module.css";

import SearchResult from "./SearchResult";

import { searchMemories }
from "../../services/search/searchEngine";

function GlobalSearch({
  moments,
}) {
  const [query, setQuery] =
    useState("");

  const results = useMemo(
    () =>
      searchMemories(
        moments,
        query
      ),
    [moments, query]
  );

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        placeholder="Search memories..."
        value={query}
        onChange={(e) =>
          setQuery(
            e.target.value
          )
        }
        className={styles.search}
      />

      {query && (
        <div className={styles.results}>
          {results.length ===
          0 ? (
            <p>
              No memories
              found.
            </p>
          ) : (
            results.map(
              (memory) => (
                <SearchResult
                  key={
                    memory.id
                  }
                  memory={
                    memory
                  }
                />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;