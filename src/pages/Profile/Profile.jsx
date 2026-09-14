import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import Navbar from "../../components/Navbar/Navbar";
import EditProfileModal from "../../components/EditProfileModal/EditProfileModal";

import styles from "./Profile.module.css";

import { supabase } from "../../services/supabase/supabaseClient";
import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";
import { getProfile } from "../../services/profile/updateProfile";

import ProfileHero from "./components/ProfileHero/ProfileHero";
import ProfileStats from "./components/ProfileStats/ProfileStats";
import Achievements from "./components/Achievements/Achievements";
import ReadingProgress from "./components/ReadingProgress/ReadingProgress";
import RecentActivity from "./components/RecentActivity/RecentActivity";
import QuickActions from "./components/QuickActions/QuickActions";
import AccountInfo from "./components/AccountInfo/AccountInfo";

function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);

  const [story, setStory] = useState(null);

  const [moments, setMoments] = useState([]);

  const [editOpen, setEditOpen] =
    useState(false);

  const [confirmingSignOut,
    setConfirmingSignOut] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  //---------------------------------------
  // Load profile data
  //---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        setUser(user);

        if (user) {
          const profileData =
            await getProfile(user.id);

          if (!cancelled) {
            setProfile(profileData);
          }
        }

        const storyData =
          await getMyStory();

        if (cancelled) return;

        setStory(storyData);

        if (storyData) {
          const momentData =
            await getMoments(
              storyData.id
            );

          if (!cancelled) {
            setMoments(
              momentData || []
            );
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  //---------------------------------------
  // Refresh profile after edit
  //---------------------------------------

  async function refreshProfile() {
    if (!user) return;

    try {
      const profileData =
        await getProfile(user.id);

      setProfile(profileData);

      const {
        data: { user: fresh },
      } = await supabase.auth.getUser();

      setUser(fresh);
    } catch (error) {
      console.error(error);
    }
  }

  //---------------------------------------
  // Sign out
  //---------------------------------------

  async function handleSignOut() {
    try {
      setSigningOut(true);

      await supabase.auth.signOut();

      navigate("/auth");
    } catch (error) {
      console.error(error);

      setSigningOut(false);

      setConfirmingSignOut(false);
    }
  }

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <div className={styles.container}>
            <div className={styles.skeletonHero} />

            <div className={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={styles.skeletonCard}
                  />
                )
              )}
            </div>
          </div>
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
            profile={profile}
            story={story}
            totalMemories={moments.length}
            onEdit={() =>
              setEditOpen(true)
            }
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

          <AccountInfo
            user={user}
            profile={profile}
          />

          <QuickActions />

          <div
            className={styles.dangerZone}
          >
            {confirmingSignOut ? (
              <div
                className={styles.signOutConfirm}
              >
                <p>
                  Sign out of Momentry? Your
                  memories will be waiting. 💛
                </p>

                <div
                  className={
                    styles.signOutActions
                  }
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setConfirmingSignOut(
                        false
                      )
                    }
                  >
                    Stay
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    loading={signingOut}
                    onClick={
                      handleSignOut
                    }
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className={styles.logout}
                onClick={() =>
                  setConfirmingSignOut(true)
                }
              >
                Sign Out
              </button>
            )}
          </div>

        </div>

      </Container>

      <EditProfileModal
        open={editOpen}
        onClose={() =>
          setEditOpen(false)
        }
        user={user}
        profile={profile}
        onSaved={
          refreshProfile
        }
      />
    </PageLayout>
  );
}

export default Profile;
