import { useMemo } from "react";

import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../ui/Loader/Loader";

import useMoments from "../../hooks/useMoments";

import styles from "./OnThisDayPage.module.css";

/**
 * On This Day — every memory that happened
 * on today's calendar date in past years,
 * newest year first.
 */
function OnThisDayPage() {
  const { moments, loading } =
    useMoments();

  const navigate = useNavigate();

  const memories = useMemo(() => {
    const now = new Date();

    return moments
      .filter((m) => {
        const d = new Date(
          m.memory_date
        );

        return (
          d.getDate() === now.getDate() &&
          d.getMonth() ===
            now.getMonth() &&
          d.getFullYear() <
            now.getFullYear()
        );
      })
      .sort(
        (a, b) =>
          new Date(b.memory_date) -
          new Date(a.memory_date)
      );
  }, [moments]);

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <Loader label="Looking back…" />
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.page}>
          <h1 className={styles.heading}>
            ✨ On This Day
          </h1>

          <p className={styles.sub}>
            {memories.length
              ? `${memories.length} memor${memories.length === 1 ? "y" : "ies"} from this date in years gone by.`
              : "Nothing from this date yet — memories you add today will surface here in the years to come."}
          </p>

          {memories.map((m) => {
            const yearsAgo =
              new Date().getFullYear() -
              new Date(
                m.memory_date
              ).getFullYear();

            return (
              <article
                key={m.id}
                className={
                  styles.card
                }
              >
                <div
                  className={
                    styles.glow
                  }
                />

                <span
                  className={
                    styles.badge
                  }
                >
                  {yearsAgo}{" "}
                  year
                  {yearsAgo === 1
                    ? ""
                    : "s"}{" "}
                  ago
                </span>

                {m.image_url && (
                  <img
                    src={m.image_url}
                    alt=""
                    loading="lazy"
                    className={
                      styles.photo
                    }
                  />
                )}

                <h3>{m.title}</h3>

                {m.location && (
                  <p
                    className={
                      styles.location
                    }
                  >
                    📍 {m.location}
                  </p>
                )}

                <button
                  type="button"
                  className={
                    styles.openButton
                  }
                  onClick={() =>
                    navigate(
                      `/moment/${m.id}`
                    )
                  }
                >
                  Relive it →
                </button>
              </article>
            );
          })}
        </div>
      </Container>
    </PageLayout>
  );
}

export default OnThisDayPage;
