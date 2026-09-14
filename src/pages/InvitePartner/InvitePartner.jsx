import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./InvitePartner.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { createInvitation } from "../../services/invitation/createInvitation";
import useNotification from "../../hooks/useNotification";

function InvitePartner() {
  const navigate = useNavigate();
  const location = useLocation();

  const notify = useNotification();

  const storyId = location.state?.storyId;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!email.trim()) {
      notify.error(
        "Missing email",
        "Please enter your partner's email."
      );
      return;
    }

    try {
      setLoading(true);

      await createInvitation(storyId, email.trim());

      notify.success(
        "Invitation sent!",
        `${email.trim()} can now accept and join your story.`
      );

      navigate("/home");
    } catch (error) {
      console.error(error);
      notify.error(
        "Couldn't send invitation",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.heading}>
            Every great story
            <br />
            has two authors.
          </h1>

          <p className={styles.body}>
            Invite your partner to start
            <br />
            creating memories together.
          </p>

          <input
            className={styles.input}
            type="email"
            placeholder="Partner's Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            onClick={handleInvite}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default InvitePartner;