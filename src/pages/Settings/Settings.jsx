import { useEffect, useState } from "react";

import Navbar from "../../components/Navbar/Navbar";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";

import SettingsSection from "./components/SettingsSection/SettingsSection";
import Appearance from "./components/Appearance/Appearance";

import BackupRestore from "../../components/BackupRestore/BackupRestore";
import BackupPreview from "../../components/BackupPreview/BackupPreview";

import { exportBackup } from "../../services/backup/exportBackup";
import { restoreBackup } from "../../services/backup/restoreBackup";
import { restoreToDatabase } from "../../services/backup/restoreToDatabase";

import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";

import styles from "./Settings.module.css";

function Settings() {
  //---------------------------------------
  // State
  //---------------------------------------

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
      alert(err);
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

      alert(
        "Backup restored successfully!"
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

      alert(
        "Restore failed."
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
          icon="🔔"
          title="Notifications"
        />

        <SettingsSection
          icon="🔒"
          title="Privacy"
        />

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
        />

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