import { useEffect, useState } from "react";

import Button from "../../../../ui/Button/Button";

import {
  pushSupported,
  getPushPermission,
  enablePush,
  disablePush,
} from "../../../../services/push/pushService";

import useNotification from "../../../../hooks/useNotification";

import styles from "./Notifications.module.css";

function Notifications() {
  const notify = useNotification();

  const [supported] = useState(
    pushSupported
  );

  const [permission, setPermission] =
    useState(() =>
      typeof Notification !== "undefined"
        ? Notification.permission
        : "default"
    );

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPushPermission().then((p) => {
      if (!cancelled) setPermission(p);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    try {
      setBusy(true);

      await enablePush();

      setPermission("granted");

      notify.success(
        "Notifications on",
        "You'll know the moment they write. 💕"
      );
    } catch (error) {
      notify.error(
        "Couldn't enable notifications",
        error.message || "Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    try {
      setBusy(true);

      await disablePush();

      setPermission("denied");

      notify.info(
        "Notifications off",
        "You can turn them back on anytime."
      );
    } catch {
      notify.error(
        "Couldn't disable",
        "Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className={styles.note}>
        Push notifications aren't available in
        this browser — install the app
        (Add to Home Screen) to get them.
      </p>
    );
  }

  const enabled =
    permission === "granted";

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <strong>Chat &amp; reminders</strong>

        <p>
          Get notified about new messages and
          upcoming birthdays &amp; anniversaries —
          even with the app closed.
        </p>
      </div>

      {enabled ? (
        <Button
          variant="secondary"
          onClick={handleDisable}
          disabled={busy}
        >
          Turn off
        </Button>
      ) : (
        <Button
          onClick={handleEnable}
          disabled={busy}
        >
          {busy ? "Enabling…" : "Turn on"}
        </Button>
      )}
    </div>
  );
}

export default Notifications;
