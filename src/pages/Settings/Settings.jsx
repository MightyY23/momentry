import { useEffect, useState } from "react";

import Navbar from "../../components/Navbar/Navbar";

import { getPreferences } from "../../services/preferences/preferences";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";

import SettingsSection from "./components/SettingsSection/SettingsSection";
import Appearance from "./components/Appearance/Appearance";
import Account from "./components/Account/Account";
import PreferenceToggles from "./components/PreferenceToggles/PreferenceToggles";

import BackupRestore from "../../components/BackupRestore/BackupRestore";
import BackupPreview from "../../components/BackupPreview/BackupPreview";

import { exportBackup } from "../../services/backup/exportBackup";
import { restoreBackup } from "../../services/backup/restoreBackup";
import { restoreToDatabase } from "../../services/backup/restoreToDatabase";

import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";
import useNotification from "../../hooks/useNotification";

import styles from "./Settings.module.css";

/**
 * Keeps <html class="reduce-motion"> in sync
 * with the stored preference, app-wide.
 */
function useReduceMotionClass() {
  // Read on mount; the toggle UI writes the
  // preference and the class applies on the
  // next Settings visit (a reload-level event).
  const [reduced] = useState(
    () => getPreferences().reading.reduceMotion
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "reduce-motion",
      reduced
    );
  }, [reduced]);

  return reduced;
}

function Settings() {
  //---------------------------------------
  // State
  //---------------------------------------

  useReduceMotionClass();

  const notify = useNotification();

  const [story, setStory] = useState(null);

  const [moments, setMoments] = useState([]);

  const [backupPreview, setBackupPreview] =
    useState(null);

  //---------------------------------------
  // Load Story + Memories
  //---------------------------------------

  useEffect(() => {
    async function loadData() {
      try {
        const storyData =
          await getMyStory();

        setStory(storyData);

        if (storyData) {
          const memoryData =
            await getMoments(
              storyData.id
            );

          setMoments(
            memoryData || []
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  //---------------------------------------
  // Export
  //---------------------------------------

  function handleExport() {
    exportBackup({
      story,
      moments,
      settings: {},
    });
  }

  //---------------------------------------
  // Restore
  //---------------------------------------

  async function handleRestore(
    file
  ) {
    try {
      const backup =
        await restoreBackup(file);

      setBackupPreview(
        backup
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't read backup file",
        "Make sure it's a valid Momentry backup."
      );
    }
  }

  //---------------------------------------
  // Confirm Restore
  //---------------------------------------

  async function confirmRestore() {
    try {
      await restoreToDatabase({
        story:
          backupPreview.story,

        moments:
          backupPreview.moments,
      });

      notify.success(
        "Backup restored!",
        "Your memories have been imported."
      );

      setBackupPreview(
        null
      );

      // Reload latest data

      const storyData =
        await getMyStory();

      setStory(storyData);

      if (storyData) {
        const memoryData =
          await getMoments(
            storyData.id
          );

        setMoments(
          memoryData || []
        );
      }
    } catch (err) {
      console.error(err);

      notify.error(
        "Restore failed",
        "Please check the backup file and try again."
      );
    }
  }

  //---------------------------------------

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <h1
          className={
            styles.heading
          }
        >
          ⚙ Settings
        </h1>

        <SettingsSection
          icon="🎨"
          title="Appearance"
        >
          <Appearance />
        </SettingsSection>

        <SettingsSection
          icon="☁"
          title="Data & Backup"
        >
          <BackupRestore
            onExport={
              handleExport
            }
            onRestore={
              handleRestore
            }
          />
        </SettingsSection>

        <SettingsSection
          icon="👤"
          title="Account"
        >
          <Account />
        </SettingsSection>

        <SettingsSection
          icon="📖"
          title="Reading & Motion"
        >
          <PreferenceToggles
            section="reading"
            items={[
              {
                key: "reduceMotion",
                label: "Reduce motion",
                hint: "Calms animations and page transitions across the whole app.",
              },
            ]}
            note="Applied instantly, everywhere."
          />
        </SettingsSection>

        <SettingsSection
          icon="📚"
          title="StoryBook"
        >
          <PreferenceToggles
            section="storybook"
            items={[
              {
                key: "autoPlayPages",
                label: "Auto-advance pages",
                hint: "Turn pages automatically while reading.",
              },
              {
                key: "showPageNumbers",
                label: "Show page numbers",
                hint: "Display page position inside the book.",
              },
            ]}
            note="StoryBook reading preferences — saved on this device."
          />
        </SettingsSection>

        <SettingsSection
          icon="🔔"
          title="Notifications"
        >
          <PreferenceToggles
            section="notifications"
            items={[
              {
                key: "storyInvitations",
                label: "Story invitations",
                hint: "When someone invites you to collaborate.",
              },
              {
                key: "collaborationActivity",
                label: "Collaboration activity",
                hint: "When collaborators add or change memories.",
              },
              {
                key: "sharedStoryActivity",
                label: "Shared story activity",
                hint: "When your shared links are read.",
              },
              {
                key: "productUpdates",
                label: "Product updates",
                hint: "Occasional news about Momentry.",
              },
            ]}
            note="Notification preferences are saved on this device. In-app notifications will respect them."
          />
        </SettingsSection>

        <SettingsSection
          icon="🔒"
          title="Privacy"
        >
          <PreferenceToggles
            section="privacy"
            items={[
              {
                key: "showLocationOnSharedStories",
                label: "Show memory locations on shared stories",
                hint: "Turn off to hide place names when sharing publicly.",
              },
            ]}
            note="Your location is only ever shown with memories you add it to — never your live position."
          />
        </SettingsSection>

        <BackupPreview
          backup={
            backupPreview
          }
          onCancel={() =>
            setBackupPreview(
              null
            )
          }
          onRestore={
            confirmRestore
          }
        />
      </Container>
    </PageLayout>
  );
}

export default Settings;