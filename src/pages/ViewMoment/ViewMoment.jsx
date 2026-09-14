import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";
import ConfirmDialog from "../../ui/ConfirmDialog/ConfirmDialog";

import styles from "./ViewMoment.module.css";

import HeroImage from "./components/HeroImage";
import MomentMeta from "./components/MomentMeta";
import MemoryInfo from "./components/MemoryInfo";
import ActionBar from "./components/ActionBar";
import MemoryNavigator from "./components/MemoryNavigator";

import { getMoment } from "../../services/moment/getMoment";
import { getAdjacentMoments } from "../../services/moment/getAdjacentMoments";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

function ViewMoment() {
  const { id } = useParams();
  const navigate = useNavigate();

  //---------------------------------------
  // Global Context
  //---------------------------------------

  const { removeMoment } =
    useMoments();

  const notify = useNotification();

  //---------------------------------------

  const [moment, setMoment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [previousMoment, setPreviousMoment] =
    useState(null);

  const [nextMoment, setNextMoment] =
    useState(null);

  //---------------------------------------
  // Load Memory
  //---------------------------------------

  useEffect(() => {
    async function loadMoment() {
      try {
        const data =
          await getMoment(id);

        setMoment(data);

        const adjacent =
          await getAdjacentMoments(
            data.story_id,
            data.id
          );

        setPreviousMoment(
          adjacent.previous
        );

        setNextMoment(
          adjacent.next
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMoment();
  }, [id]);

  //---------------------------------------
  // Keyboard Navigation
  //---------------------------------------

  useEffect(() => {
    function handleKey(e) {
      if (
        e.key === "ArrowLeft" &&
        previousMoment
      ) {
        navigate(
          `/moment/${previousMoment.id}`
        );
      }

      if (
        e.key === "ArrowRight" &&
        nextMoment
      ) {
        navigate(
          `/moment/${nextMoment.id}`
        );
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
    previousMoment,
    nextMoment,
    navigate,
  ]);

  //---------------------------------------
  // Delete
  //---------------------------------------

  async function handleDelete() {
    try {
      setDeleting(true);

      await removeMoment(
        moment
      );

      setConfirmDelete(false);

      navigate("/home");
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't delete memory",
        error.message || "Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <h2>
            Loading memory...
          </h2>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Not Found
  //---------------------------------------

  if (!moment) {
    return (
      <PageLayout>
        <Container>
          <h2>
            Memory not found.
          </h2>

          <Button
            onClick={() =>
              navigate("/home")
            }
          >
            Back Home
          </Button>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // UI
  //---------------------------------------

  return (
    <PageLayout>
      <Container>
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
        >
          <HeroImage
            image={moment.image_url}
            title={moment.title}
          />

          <MomentMeta
            moment={moment}
          />

          <MemoryInfo
            moment={moment}
          />

          <section
            className={styles.story}
          >
            <h2>Our Story</h2>

            <p>
              {moment.description}
            </p>
          </section>

          <ActionBar
            moment={moment}
            deleting={deleting}
            onBack={() =>
              navigate("/home")
            }
            onEdit={() =>
              navigate(
                `/edit-moment/${moment.id}`
              )
            }
            onDelete={() =>
              setConfirmDelete(true)
            }
          />

          <MemoryNavigator
            previous={previousMoment}
            next={nextMoment}
            onPrevious={() =>
              previousMoment &&
              navigate(
                `/moment/${previousMoment.id}`
              )
            }
            onNext={() =>
              nextMoment &&
              navigate(
                `/moment/${nextMoment.id}`
              )
            }
          />
        </motion.div>
      </Container>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this memory?"
        message={`"${
          moment?.title ||
          "This memory"
        }" will be permanently removed, including its photo. This cannot be undone.`}
        confirmLabel="Delete Forever"
        cancelLabel="Keep it"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmDelete(false)
        }
      />
    </PageLayout>
  );
}

export default ViewMoment;