import { useEffect, useState } from "react";

import { Bell, BellOff, X } from "lucide-react";

import {
  getPushPermission,
  pushSupported,
  isPushServerConfigured,
  enablePush,
} from "../../../../services/push/pushService";

import styles from "./NotificationsNudge.module.css";

const DISMISS_KEY =
  "momentry:push-nudge-dismissed";

/**
 * "Notifications disabled — tap to enable"
 * nudge. Shows on Home for signed-in users
 * who haven't granted the permission yet:
 *
 *   - "default"  → tap asks permission + subscribes
 *   - "denied"   → explains how to re-enable in
 *                  browser/site settings (a tap
 *                  can't re-ask once denied)
 *   - unsupported / no VAPID key → never renders
 *   - granted    → never renders
 *
 * Dismissal is remembered for 14 days so the
 * banner stays quiet but comes back eventually.
 */
function NotificationsNudge() {
  const [state, setState] = useState(null);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      if (!pushSupported()) return;

      try {
        await navigator.serviceWorker.ready;
      } catch {
        return;
      }

      const permission =
        await getPushPermission();

      if (cancelled) return;

      if (
        permission === "granted" ||
        permission === "unsupported"
      ) {
        return;
      }

      // The server must have VAPID keys set
      // (setup:push run) — otherwise tapping
      // Enable could never succeed. Hidden
      // until notifications are actually
      // deliverable.
      const serverReady =
        await isPushServerConfigured();

      if (cancelled) return;

      if (!serverReady) return;

      // Respect a recent dismissal.
      const dismissedAt = Number(
        localStorage.getItem(DISMISS_KEY) || 0
      );

      const fourteenDays =
        14 * 24 * 60 * 60 * 1000;

      if (
        dismissedAt &&
        Date.now() - dismissedAt < fourteenDays
      ) {
        return;
      }

      setState(permission);
    }

    probe();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) return null;

  function dismiss() {
    localStorage.setItem(
      DISMISS_KEY,

      String(Date.now())
    );

    setState(null);
  }

  async function handleEnable() {
    if (state === "denied" || busy) return;

    setBusy(true);

    try {
      await enablePush();

      setState(null);
    } catch {
      // The request was blocked or denied —
      // switch to the guidance state.
      setState("denied");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      className={styles.banner}
      role="status"
    >
      <span className={styles.icon}>
        {state === "denied" ? (
          <BellOff size={18} />
        ) : (
          <Bell size={18} />
        )}
      </span>

      <div className={styles.text}>
        <strong>
          {state === "denied"
            ? "Notifications are turned off"
            : "Never miss a note from your partner"}
        </strong>

        <span>
          {state === "denied"
            ? "Your browser blocked notifications for this site. Allow them in your browser or site settings to get chat + occasion alerts."
            : "Turn on notifications to get sealed notes, messages and birthday reminders the moment they land."}
        </span>
      </div>

      {state !== "denied" && (
        <button
          type="button"
          className={styles.enable}
          onClick={handleEnable}
          disabled={busy}
        >
          {busy
            ? "Turning on…"
            : "Enable"}
        </button>
      )}

      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label="Dismiss notification reminder"
      >
        <X size={16} />
      </button>
    </aside>
  );
}

export default NotificationsNudge;
