import { useEffect, useRef, useState } from "react";

import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
} from "lucide-react";

import { supabase } from "../../services/supabase/supabaseClient";

import styles from "./CallOverlay.module.css";

//----------------------------------------
// Partner voice calls over WebRTC.
//
// Signaling rides a Supabase realtime
// broadcast channel scoped to the story:
//   call-offer / call-answer / call-end
//   + ice candidates.
//
// Both peers already share a story, so the
// channel name is derived from the story id
// — no extra RLS surface needed.
//----------------------------------------

function CallOverlay({
  storyId,
  myUserId,
  partnerName,
  state,
  // "calling" | "incoming" | "active" | "ended"
  onStateChange,
  onClose,
}) {
  const pcRef = useRef(null);

  const channelRef = useRef(null);

  const localStreamRef = useRef(null);

  const [muted, setMuted] = useState(false);

  const [seconds, setSeconds] = useState(0);

  const [statusText, setStatusText] =
    useState("Calling…");

  //---------------------------------------
  // Signaling channel
  //---------------------------------------

  useEffect(() => {
    if (!storyId) return;

    const channel = supabase.channel(
      `call-${storyId}`
    );

    channel
      .on(
        "broadcast",
        { event: "call-offer" },
        async ({ payload }) => {
          if (
            payload.from === myUserId
          )
            return;

          await handleOffer(payload);
        }
      )
      .on(
        "broadcast",
        { event: "call-answer" },
        async ({ payload }) => {
          if (
            payload.from === myUserId
          )
            return;

          await pcRef.current?.setRemoteDescription(
            new RTCSessionDescription(
              payload.sdp
            )
          );

          onStateChange("active");
        }
      )
      .on(
        "broadcast",
        { event: "call-ice" },
        async ({ payload }) => {
          if (
            payload.from === myUserId
          )
            return;

          try {
            await pcRef.current?.addIceCandidate(
              payload.candidate
            );
          } catch {
            /* late candidate */
          }
        }
      )
      .on(
        "broadcast",
        { event: "call-end" },
        ({ payload }) => {
          if (
            payload.from === myUserId
          )
            return;

          teardown();

          onStateChange(null);

          onClose();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);

      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, myUserId]);

  //---------------------------------------
  // Peer setup helper
  //---------------------------------------

  function createPeer() {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channelRef.current?.send({
          type: "broadcast",
          event: "call-ice",
          payload: {
            from: myUserId,
            candidate: e.candidate,
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "connected"
      ) {
        onStateChange("active");
      }
    };

    return pc;
  }

  async function getMic() {
    const stream =
      await navigator.mediaDevices.getUserMedia(
        { audio: true }
      );

    localStreamRef.current = stream;

    return stream;
  }

  //---------------------------------------
  // Caller: the user who pressed call
  //---------------------------------------

  useEffect(() => {
    if (state !== "calling") return;

    let cancelled = false;

    async function beginCall() {
      try {
        const stream = await getMic();

        if (cancelled) return;

        const pc = createPeer();

        stream
          .getTracks()
          .forEach((t) =>
            pc.addTrack(t, stream)
          );

        pcRef.current = pc;

        const offer =
          await pc.createOffer();

        await pc.setLocalDescription(
          offer
        );

        channelRef.current?.send({
          type: "broadcast",
          event: "call-offer",
          payload: {
            from: myUserId,
            sdp: offer,
          },
        });
      } catch {
        setStatusText(
          "Microphone unavailable"
        );
      }
    }

    beginCall();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  //---------------------------------------
  // Callee: accept an incoming offer
  //---------------------------------------

  async function handleOffer(payload) {
    onStateChange("incoming");

    incomingRef.current = payload;
  }

  const incomingRef = useRef(null);

  async function acceptCall() {
    try {
      const payload =
        incomingRef.current;

      if (!payload) return;

      const stream = await getMic();

      const pc = createPeer();

      stream
        .getTracks()
        .forEach((t) =>
          pc.addTrack(t, stream)
        );

      pcRef.current = pc;

      await pc.setRemoteDescription(
        new RTCSessionDescription(
          payload.sdp
        )
      );

      const answer =
        await pc.createAnswer();

      await pc.setLocalDescription(
        answer
      );

      channelRef.current?.send({
        type: "broadcast",
        event: "call-answer",
        payload: {
          from: myUserId,
          sdp: answer,
        },
      });

      onStateChange("active");
    } catch {
      setStatusText(
        "Microphone unavailable"
      );
    }
  }

  function declineCall() {
    endCall();
  }

  //---------------------------------------
  // Call timer
  //---------------------------------------

  useEffect(() => {
    if (state !== "active") return;

    const t = setInterval(
      () => setSeconds((s) => s + 1),
      1000
    );

    return () => clearInterval(t);
  }, [state]);

  //---------------------------------------
  // Remote audio element
  //---------------------------------------

  useEffect(() => {
    if (!state) return;

    const audio =
      document.createElement("audio");

    audio.autoplay = true;

    document.body.appendChild(audio);

    remoteAudioRef.current = audio;

    const pc = pcRef.current;

    if (pc) {
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
      };
    }

    return () => {
      audio.remove();
    };
  }, [state === "active"]);

  const remoteAudioRef = useRef(null);

  //---------------------------------------
  // Controls
  //---------------------------------------

  function toggleMute() {
    const stream = localStreamRef.current;

    if (!stream) return;

    const next = !muted;

    stream
      .getAudioTracks()
      .forEach((t) => (t.enabled = !next));

    setMuted(next);
  }

  function endCall() {
    channelRef.current?.send({
      type: "broadcast",
      event: "call-end",
      payload: { from: myUserId },
    });

    teardown();

    onClose();
  }

  function teardown() {
    localStreamRef.current
      ?.getTracks()
      .forEach((t) => t.stop());

    localStreamRef.current = null;

    pcRef.current?.close();

    pcRef.current = null;

    setSeconds(0);

    setMuted(false);
  }

  useEffect(() => {
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //---------------------------------------
  // Render
  //---------------------------------------

  if (!state) return null;

  const mm = String(
    Math.floor(seconds / 60)
  ).padStart(2, "0");

  const ss = String(seconds % 60).padStart(
    2,
    "0"
  );

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Voice call"
    >
      <div className={styles.card}>
        <div
          className={
            state === "calling" ||
            state === "incoming"
              ? `${styles.avatarRing} ${styles.ringPulse}`
              : styles.avatarRing
          }
        >
          <span
            className={styles.avatarInitial}
            aria-hidden="true"
          >
            {(partnerName || "♥")
              .trim()
              .charAt(0)
              .toUpperCase()}
          </span>
        </div>

        <h2>{partnerName}</h2>

        <p className={styles.status}>
          {state === "active"
            ? `${mm}:${ss}`
            : statusText}
        </p>

        <div className={styles.controls}>
          {state === "incoming" ? (
            <>
              <button
                type="button"
                className={`${styles.roundButton} ${styles.decline}`}
                onClick={declineCall}
                aria-label="Decline call"
              >
                <PhoneOff size={22} />
              </button>

              <button
                type="button"
                className={`${styles.roundButton} ${styles.accept}`}
                onClick={acceptCall}
                aria-label="Accept call"
              >
                <Phone size={22} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.roundButton} ${
                  muted ? styles.mutedActive : ""
                }`}
                onClick={toggleMute}
                aria-label={
                  muted
                    ? "Unmute"
                    : "Mute"
                }
              >
                {muted ? (
                  <MicOff size={22} />
                ) : (
                  <Mic size={22} />
                )}
              </button>

              <button
                type="button"
                className={`${styles.roundButton} ${styles.decline}`}
                onClick={endCall}
                aria-label="End call"
              >
                <PhoneOff size={22} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallOverlay;
