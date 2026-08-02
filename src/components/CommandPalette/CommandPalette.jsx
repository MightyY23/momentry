import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import styles from "./CommandPalette.module.css";

import { searchMemories } from "../../services/search/searchEngine";

import {
  getRecentSearches,
  saveRecentSearch,
} from "../../services/search/searchHistory";

import { groupSearchResults } from "../../services/search/groupSearchResults";

function CommandPalette({
  moments,
}) {
  const navigate = useNavigate();

  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [selected, setSelected] =
    useState(0);

  const [recent, setRecent] =
    useState(
      getRecentSearches()
    );

  //---------------------------------------
  // Search
  //---------------------------------------

  const results = useMemo(() => {
    return searchMemories(
      moments,
      query
    ).map((memory) => ({
      type: "memory",
      icon: "❤️",
      title: memory.title,
      subtitle:
        memory.location ||
        "Memory",
      data: memory,
    }));
  }, [moments, query]);

  //---------------------------------------
  // Grouped Results
  //---------------------------------------

  const groupedResults =
    useMemo(
      () =>
        groupSearchResults(results),
      [results]
    );

  //---------------------------------------
  // Flattened Results
  //---------------------------------------

  const flatResults =
    useMemo(() => {
      return Object.values(
        groupedResults
      ).flat();
    }, [groupedResults]);

  //---------------------------------------
  // Keyboard
  //---------------------------------------

  useEffect(() => {
    function handleKey(e) {
      //---------------------------------------
      // Ctrl + K
      //---------------------------------------

      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "k"
      ) {
        e.preventDefault();

        setOpen(true);

        return;
      }

      //---------------------------------------

      if (!open) return;

      if (e.key === "Escape") {
        setOpen(false);

        setQuery("");

        return;
      }

      //---------------------------------------

      if (e.key === "ArrowDown") {
        e.preventDefault();

        setSelected((prev) =>
          Math.min(
            prev + 1,
            flatResults.length - 1
          )
        );

        return;
      }

      //---------------------------------------

      if (e.key === "ArrowUp") {
        e.preventDefault();

        setSelected((prev) =>
          Math.max(prev - 1, 0)
        );

        return;
      }

      //---------------------------------------

      if (
        e.key === "Enter" &&
        flatResults[selected]
      ) {
        if (query.trim()) {
          saveRecentSearch(query);

          setRecent(
            getRecentSearches()
          );
        }

        navigate(
          `/moment/${flatResults[selected].data.id}`
        );

        setOpen(false);

        setQuery("");

        setSelected(0);
      }
    }

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [
    open,
    query,
    selected,
    flatResults,
    navigate,
  ]);

  //---------------------------------------

  if (!open) return null;

  //---------------------------------------
  // Global index for highlighting
  //---------------------------------------

  let globalIndex = -1;

  //---------------------------------------

  return (
    <div
      className={styles.overlay}
      onClick={() =>
        setOpen(false)
      }
    >
      <div
        className={styles.modal}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <input
          autoFocus
          placeholder="Search memories..."
          value={query}
          onChange={(e) => {
            setQuery(
              e.target.value
            );

            setSelected(0);
          }}
          className={styles.search}
        />

        <div className={styles.results}>
          {!query ? (
            <>
              <div
                className={
                  styles.groupTitle
                }
              >
                🕘 Recent Searches
              </div>

              {recent.length === 0 ? (
                <div
                  className={
                    styles.empty
                  }
                >
                  No recent searches.
                </div>
              ) : (
                recent.map(
                  (item) => (
                    <div
                      key={item}
                      className={
                        styles.item
                      }
                      onClick={() =>
                        setQuery(item)
                      }
                    >
                      <div
                        className={
                          styles.icon
                        }
                      >
                        🕘
                      </div>

                      <div>
                        <h4>{item}</h4>
                      </div>
                    </div>
                  )
                )
              )}
            </>
          ) : (
            Object.entries(
              groupedResults
            ).map(
              ([type, items]) => (
                <div
                  key={type}
                  className={
                    styles.group
                  }
                >
                  <div
                    className={
                      styles.groupTitle
                    }
                  >
                    {type ===
                      "memory" &&
                      "❤️ Memories"}

                    {type ===
                      "achievement" &&
                      "🏆 Achievements"}

                    {type ===
                      "storybook" &&
                      "📖 StoryBook"}
                  </div>

                  {items.map(
                    (item) => {
                      globalIndex++;

                      return (
                        <div
                          key={`${type}-${item.data.id}`}
                          className={`${styles.item} ${
                            selected ===
                            globalIndex
                              ? styles.active
                              : ""
                          }`}
                          onClick={() =>
                            navigate(
                              `/moment/${item.data.id}`
                            )
                          }
                        >
                          <div
                            className={
                              styles.icon
                            }
                          >
                            {
                              item.icon
                            }
                          </div>

                          <div>
                            <h4>
                              {
                                item.title
                              }
                            </h4>

                            <p>
                              {
                                item.subtitle
                              }
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;