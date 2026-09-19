import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import styles from "./AcceptInvitation.module.css";

import { supabase } from "../../services/supabase/supabaseClient";
import { getPendingInvitation } from "../../services/invitation/getPendingInvitation";
import { acceptInvitation } from "../../services/invitation/acceptInvitation";
import {
  applyPendingAnniversary,
} from "../../services/story/applyPendingAnniversary";
import { declineInvitation } from "../../services/invitation/declineInvitation";
import ConfirmDialog from "../../ui/ConfirmDialog/ConfirmDialog";
import useNotification from "../../hooks/useNotification";
import useMoments from "../../hooks/useMoments";

function AcceptInvitation() {
  const navigate = useNavigate();

  const notify = useNotification();

  // Acceptance changes which story the user
  // belongs to — the SPA must refetch story
  // + moments, or the dashboard shows stale
  // empty data until a manual reload.
  const { refresh: refreshMoments } = useMoments();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvitation() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const data = await getPendingInvitation(user.email);

      if (!data) {
        navigate("/create-story");
        return;
      }

      if (cancelled) return;

      setInvitation(data);
    } catch (error) {
      console.error(error);
      notify.error(
        "Couldn't load invitation",
        "The invitation may have expired."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

    loadInvitation();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAccept() {
    try {
      setAccepting(true);

      await acceptInvitation(invitation);

      // Apply the anniversary collected in
      // onboarding now that membership exists.
      await applyPendingAnniversary();

      // Refresh global story/moments state BEFORE
      // navigating so /home renders real data.
      await refreshMoments();

      navigate("/home");
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't accept invitation",
        error.message
      );
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    try {
      setDeclining(true);

      await declineInvitation(invitation.id);

      setConfirmDecline(false);

      notify.success(
        "Invitation declined",
        "You can create your own story anytime."
      );

      navigate("/create-story");
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't decline invitation",
        error.message || "Please try again."
      );

      setDeclining(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <h2>Loading invitation...</h2>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <div className={styles.card}>
          <div className={styles.emoji}>❤️</div>

          <h1>You've Been Invited!</h1>

          <p className={styles.subtitle}>
            Join your shared story.
          </p>

          <div className={styles.storyBox}>
            {/* invitation.stories is null under RLS when
                the invitee can't see the story yet. */}
            <h2>
              {invitation.stories?.title ?? "A Shared Story"}
            </h2>

            <p>
              Someone invited you to collaborate on this story.
            </p>
          </div>

          <div className={styles.buttons}>
            <Button
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting
                ? "Accepting..."
                : "Accept Invitation"}
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                setConfirmDecline(true)
              }
            >
              Decline
            </Button>
          </div>
        </div>
      </Container>

      <ConfirmDialog
        open={confirmDecline}
        title="Decline this invitation?"
        message={`You'll no longer be able to join "${invitation?.stories?.title || "this story"}" unless you're invited again.`}
        confirmLabel="Decline"
        cancelLabel="Keep Invitation"
        danger
        loading={declining}
        onConfirm={
          handleDecline
        }
        onCancel={() =>
          setConfirmDecline(false)
        }
      />
    </PageLayout>
  );
}

export default AcceptInvitation;