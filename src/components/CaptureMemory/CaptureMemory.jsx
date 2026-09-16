import {
  useEffect,
  useRef,
  useState,
} from "react";

import Button from "../../ui/Button/Button";

import { reverseGeocode } from "../../services/map/placeSearch";

import useNotification from "../../hooks/useNotification";

import styles from "./CaptureMemory.module.css";

function timeOfDay(date) {
  const h = date.getHours();

  if (h < 5) return "Late night";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";

  return "Night";
}

function shortPlace(label) {
  if (!label) return null;

  const first = label.split(",")[0].trim();

  return first.length <= 40 ? first : first.slice(0, 40);
}

/**
 * Capture a memory the moment it happens:
 * camera preview -> shutter -> photo + GPS
 * + suggested title, handed to the Add
 * Memory form.
 */
function CaptureMemory({ open, onClose }) {
  const notify = useNotification();

  const videoRef = useRef(null);

  const streamRef = useRef(null);

  const [phase, setPhase] = useState(
    "camera" // camera | processing
  );

  const shotRef = useRef(null);

  //---------------------------------------
  // Camera lifecycle
  //---------------------------------------

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    async function start() {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
              audio: false,
            }
          );

        if (cancelled) {
          stream
            .getTracks()
            .forEach((t) => t.stop());

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;
        }
      } catch {
        // No camera or permission denied —
        // offer the file-input fallback.
        notify.error(
          "Camera unavailable",
          "Opening your photo picker instead — capture is not lost."
        );

        setPhase("processing");
        onClose?.();
      }
    }

    start();

    return () => {
      cancelled = true;

      streamRef.current
        ?.getTracks()
        .forEach((t) => t.stop());

      streamRef.current = null;
    };
  }, [open]);

  //---------------------------------------
  // Shutter
  //---------------------------------------

  async function handleShutter() {
    const video = videoRef.current;

    if (!video) return;

    try {
      setPhase("processing");

      const canvas =
        document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      canvas
        .getContext("2d")
        .drawImage(video, 0, 0);

      const blob = await new Promise(
        (resolve) =>
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.9
          )
      );

      const file = new File(
        [blob],
        `capture-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      shotRef.current = file;

      streamRef.current
        ?.getTracks()
        .forEach((t) => t.stop());

      // GPS + place + suggested title
      const now = new Date();

      let title =
        `${timeOfDay(now)} memory`;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } =
            pos.coords;

          const label =
            await reverseGeocode(
              latitude,
              longitude
            );

          const place = shortPlace(label);

          if (place) {
            title = `${timeOfDay(now)} at ${place}`;
          }

          onClose?.({
            file: shotRef.current || file,
            coords: {
              lat: latitude,
              lng: longitude,
            },
            placeLabel: label,
            suggestedTitle: title,
            memoryDate:
              now.toISOString().slice(0, 10),
          });
        },
        () => {
          // No GPS — hand over with typed-in
          // location left to the user.
          onClose?.({
            file: shotRef.current || file,
            coords: null,
            placeLabel: null,
            suggestedTitle: title,
            memoryDate:
              now.toISOString().slice(0, 10),
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        }
      );
    } catch {
      notify.error(
        "Capture failed",
        "Couldn't take the photo — try again."
      );

      setPhase("camera");
    }
  }

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Capture a memory"
    >
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        playsInline
        muted
      />

      <div className={styles.controls}>
        <Button
          variant="secondary"
          onClick={() => onClose?.()}
        >
          Cancel
        </Button>

        <button
          type="button"
          className={styles.shutter}
          onClick={handleShutter}
          disabled={phase === "processing"}
          aria-label="Take photo"
        >
          {phase === "processing" ? "…" : ""}
        </button>

        <div className={styles.spacer} />
      </div>
    </div>
  );
}

export default CaptureMemory;
