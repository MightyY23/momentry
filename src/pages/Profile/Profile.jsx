import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";

import Navbar from "../../components/Navbar/Navbar";

import styles from "./Profile.module.css";

import { supabase } from "../../services/supabase/supabaseClient";
import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";

import ProfileHero from "./components/ProfileHero/ProfileHero";
import ProfileStats from "./components/ProfileStats/ProfileStats";
import Achievements from "./components/Achievements/Achievements";
import ReadingProgress from "./components/ReadingProgress/ReadingProgress";
import RecentActivity from "./components/RecentActivity/RecentActivity";
import QuickActions from "./components/QuickActions/QuickActions";

function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);

  const [story, setStory] = useState(null);

  const [moments, setMoments] = useState([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        //---------------------------------------
        // User
        //---------------------------------------

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        //---------------------------------------
        // Story
        //---------------------------------------

        const storyData =
          await getMyStory();

        setStory(storyData);

        //---------------------------------------
        // Moments
        //---------------------------------------

        if (storyData) {
          const momentData =
            await getMoments(
              storyData.id
            );

          setMoments(
            momentData || []
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <h2>Loading Profile...</h2>
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

        <Navbar />

        <div className={styles.container}>

          <ProfileHero
            user={user}
            story={story}
            totalMemories={moments.length}
          />

          <ProfileStats
            moments={moments}
          />

          <Achievements
            moments={moments}
          />

          <ReadingProgress
            moments={moments}
          />

          <RecentActivity
            moments={moments}
            onOpen={(id) =>
              navigate(`/moment/${id}`)
            }
          />

          <QuickActions />

        </div>

      </Container>
    </PageLayout>
  );
}

export default Profile;