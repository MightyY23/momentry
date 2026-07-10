import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import styles from "./AcceptInvitation.module.css";

import { supabase } from "../../services/supabase/supabaseClient";
import { getPendingInvitation } from "../../services/invitation/getPendingInvitation";
import { acceptInvitation } from "../../services/invitation/acceptInvitation";

function AcceptInvitation() {
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, []);

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

      setInvitation(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load invitation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    try {
      setAccepting(true);

      await acceptInvitation(invitation);

      navigate("/home");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({
          status: "declined",
        })
        .eq("id", invitation.id);

      if (error) throw error;

      navigate("/create-story");
    } catch (error) {
      console.error(error);
      alert(error.message);
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
            <h2>{invitation.stories.title}</h2>

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

            <Button onClick={handleDecline}>
              Decline
            </Button>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}

export default AcceptInvitation;