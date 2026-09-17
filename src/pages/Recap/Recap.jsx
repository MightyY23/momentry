import { useMemo, useState } from "react";

import { Share2 } from "lucide-react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../ui/Loader/Loader";
import Button from "../../ui/Button/Button";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

import styles from "./Recap.module.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthKey(iso) {
  const d = new Date(iso);

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

function Recap() {
  const { story, moments, loading } =
    useMoments();

  const notify = useNotification();

  const [selected, setSelected] = useState(
    () => monthKey(new Date().toISOString())
  );

  const available = useMemo(() => {
    const keys = new Set(
      moments.map((m) =>
        monthKey(m.memory_date)
      )
    );

    return [...keys].sort().reverse();
  }, [moments]);

  const monthMoments = useMemo(
    () =>
      moments
        .filter(
          (m) =>
            monthKey(m.memory_date) ===
            selected
        )
        .sort(
          (a, b) =>
            new Date(a.memory_date) -
            new Date(b.memory_date)
        ),
    [moments, selected]
  );

  const stats = useMemo(() => {
    const photos = monthMoments.filter(
      (m) => m.image_url
    ).length;

    const places = new Set(
      monthMoments
        .map((m) => m.location)
        .filter(Boolean)
    ).size;

    const favorites = monthMoments.filter(
      (m) => m.is_favorite
    ).length;

    return {
      total: monthMoments.length,

      photos,

      places,

      favorites,
    };
  }, [monthMoments]);

  function shareRecap() {
    const [year, month] =
      selected.split("-");

    const lines = [
      `📖 ${story?.title || "Our story"} — ${MONTHS[Number(month) - 1]} ${year} recap`,
      "",
      `💫 ${stats.total} memor${stats.total === 1 ? "y" : "ies"}`,
      `📸 ${stats.photos} with photos`,
      `📍 ${stats.places} place${stats.places === 1 ? "" : "s"}`,
      `❤️ ${stats.favorites} favorite${stats.favorites === 1 ? "" : "s"}`,
      "",
      ...monthMoments.slice(0, 10).map(
        (m) =>
          `• ${m.title} (${new Date(
            m.memory_date
          ).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
          })})`
      ),
    ];

    const text = lines.join("\n");

    if (navigator.share) {
      navigator
        .share({
          title: "Momentry recap",
          text,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        ?.writeText(text)
        .then(() =>
          notify.success(
            "Recap copied",
            "Paste it anywhere you like."
          )
        )
        .catch(() =>
          notify.error(
            "Couldn't share",
            "Copy is unavailable in this browser."
          )
        );
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <Loader label="Gathering memories…" />
        </Container>
      </PageLayout>
    );
  }

  const [year, month] = selected.split("-");

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.page}>
          <h1 className={styles.heading}>
            📊 Monthly Recap
          </h1>

          <p className={styles.sub}>
            Relive what you lived, month by
            month.
          </p>

          {/* -------- Month picker -------- */}

          <div
            className={styles.pickerRow}
          >
            <select
              className={styles.picker}
              value={selected}
              onChange={(e) =>
                setSelected(e.target.value)
              }
              aria-label="Pick a month"
            >
              {available.length === 0 && (
                <option value={selected}>
                  No memories yet
                </option>
              )}

              {available.map((k) => {
                const [y, m] =
                  k.split("-");

                return (
                  <option
                    key={k}
                    value={k}
                  >
                    {MONTHS[Number(m) - 1]}{" "}
                    {y}
                  </option>
                );
              })}
            </select>
          </div>

          {/* -------- Hero stat -------- */}

          <div className={styles.heroCard}>
            <span
              className={styles.heroLabel}
            >
              {MONTHS[Number(month) - 1]}{" "}
              {year}
            </span>

            <strong
              className={styles.heroValue}
            >
              {stats.total}
            </strong>

            <span
              className={styles.heroCaption}
            >
              memor
              {stats.total === 1
                ? "y"
                : "ies"}{" "}
              made
            </span>
          </div>

          {/* -------- Stat chips -------- */}

          <div
            className={styles.statGrid}
          >
            <div
              className={styles.statCard}
            >
              <span>📸</span>

              <strong>
                {stats.photos}
              </strong>

              <small>Photos</small>
            </div>

            <div
              className={styles.statCard}
            >
              <span>📍</span>

              <strong>
                {stats.places}
              </strong>

              <small>Places</small>
            </div>

            <div
              className={styles.statCard}
            >
              <span>❤️</span>

              <strong>
                {stats.favorites}
              </strong>

              <small>Favorites</small>
            </div>
          </div>

          {/* -------- Photo strip -------- */}

          {monthMoments.some(
            (m) => m.image_url
          ) && (
            <div
              className={styles.photoStrip}
            >
              {monthMoments
                .filter((m) => m.image_url)
                .slice(0, 6)
                .map((m) => (
                  <img
                    key={m.id}
                    src={m.image_url}
                    alt={m.title}
                    loading="lazy"
                  />
                ))}
            </div>
          )}

          {/* -------- Memory list -------- */}

          {monthMoments.length > 0 ? (
            <ul
              className={styles.memoryList}
            >
              {monthMoments.map((m) => (
                <li
                  key={m.id}
                  className={
                    styles.memoryRow
                  }
                >
                  <span
                    className={
                      styles.memoryDate
                    }
                  >
                    {new Date(
                      m.memory_date
                    ).toLocaleDateString(
                      undefined,
                      {
                        day: "numeric",
                        month: "short",
                      }
                    )}
                  </span>

                  <span
                    className={
                      styles.memoryTitle
                    }
                  >
                    {m.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              No memories this month — make
              one worth recapping ✨
            </p>
          )}

          {stats.total > 0 && (
            <div
              className={styles.shareRow}
            >
              <Button
                onClick={shareRecap}
              >
                <Share2 size={16} />
                Share this recap
              </Button>
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}

export default Recap;
