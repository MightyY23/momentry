import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import styles from "./Profile.module.css";

import { supabase } from "../../services/supabase/supabaseClient";
import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [story, setStory] = useState(null);
  const [moments, setMoments] = useState([]);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      const storyData = await getMyStory();

      setStory(storyData);

      if (storyData) {
        const momentData = await getMoments(storyData.id);
        setMoments(momentData);
      }
    }

    loadProfile();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();

    navigate("/auth");
  }

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.card}>
          <h1>👤 Profile</h1>

          <div className={styles.info}>
            <p>
              <strong>Email:</strong>{" "}
              {user?.email}
            </p>

            <p>
              <strong>Story:</strong>{" "}
              {story?.title}
            </p>

            <p>
              <strong>Total Memories:</strong>{" "}
              {moments.length}
            </p>

            <p>
              <strong>Favorite Memories:</strong>{" "}
              {
                moments.filter(
                  (m) => m.is_favorite
                ).length
              }
            </p>
          </div>

          <button
            className={styles.logout}
            onClick={handleSignOut}
          >
            🚪 Sign Out
          </button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default Profile;