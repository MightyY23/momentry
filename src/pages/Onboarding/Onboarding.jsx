import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Button from "../../ui/Button/Button";

import { supabase } from "../../services/supabase/supabaseClient";
import {
  updateProfile,
} from "../../services/profile/updateProfile";
import {
  uploadAvatar,
} from "../../services/profile/avatar";
import {
  validateImageFile,
} from "../../services/storage/uploadImage";

import useNotification from "../../hooks/useNotification";

import styles from "./Onboarding.module.css";

/**
 * First-login onboarding: collect the personal
 * info Momentry needs — display name, birthday
 * (powers the birthday reminder) and an optional
 * avatar. Marks onboarding_completed so the user
 * never sees this again.
 */
function Onboarding() {
  const navigate = useNavigate();
  const notify = useNotification();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [finishing, setFinishing] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  //---------------------------------------
  // Birthday validation
  //---------------------------------------

  const birthDateError = (() => {
    if (!birthDate) return "";

    const chosen = new Date(birthDate);
    const today = new Date();

    if (chosen > today) {
      return "Birthdays can't be in the future.";
    }

    const age =
      (today - chosen) /
      (1000 * 60 * 60 * 24 * 365.25);

    if (age < 13) {
      return "You need to be at least 13.";
    }

    if (age > 120) {
      return "Please enter a valid date.";
    }

    return "";
  })();



  //---------------------------------------
  // Avatar upload (optional, step 3)
  //---------------------------------------

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const validationError = validateImageFile(file);

    if (validationError) {
      notify.error("Invalid image", validationError);
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const url = await uploadAvatar(
        user.id,
        file
      );

      setAvatarUrl(url);
    } catch (error) {
      console.error(error);
      notify.error(
        "Upload failed",
        error.message ||
          "Couldn't upload your photo."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  //---------------------------------------
  // Finish: persist + route onward
  //---------------------------------------

  async function handleFinish() {
    if ([...fullName.trim()].length < 2 || !birthDate) {
      notify.error(
        "Almost there",
        "We need your name and birthday to continue."
      );
      return;
    }

    try {
      setFinishing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await updateProfile(user.id, {
        fullName: fullName.trim(),
        birthDate,
        avatarUrl: avatarUrl || undefined,
        onboardingCompleted: true,
      });

      // Route like login does: pending invitation
      // first, then story presence.
      const invitation =
        await getPendingSafely();

      if (invitation) {
        navigate("/accept-invitation", {
          replace: true,
        });
        return;
      }

      const { data: memberships } =
        await supabase
          .from("story_members")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      navigate(
        memberships ? "/home" : "/create-story",
        { replace: true }
      );
    } catch (error) {
      console.error(error);
      notify.error(
        "Couldn't save your profile",
        error.message || "Please try again."
      );
      setFinishing(false);
    }
  }

  async function getPendingSafely() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { getPendingInvitation } =
        await import(
          "../../services/invitation/getPendingInvitation"
        );

      return await getPendingInvitation(
        user.email
      );
    } catch {
      return null;
    }
  }

  //---------------------------------------
  // Step transitions
  //---------------------------------------

  function next() {
    if (step === 0 && [...fullName.trim()].length < 2) {
      notify.error(
        "Your name",
        "Please enter the name your partner will see."
      );
      return;
    }

    if (step === 1 && (!birthDate || birthDateError)) {
      notify.error(
        "Your birthday",
        birthDateError ||
          "We need it to remind your partner to celebrate."
      );
      return;
    }

    setStep((s) => Math.min(s + 1, 2));
  }

  const steps = [
    {
      emoji: "👋",
      title: "What should we call you?",
      hint: "This is how you'll appear to your partner across every shared memory.",
      body: (
        <input
          className={styles.input}
          type="text"
          value={fullName}
          autoComplete="name"
          placeholder="Your name"
          onChange={(e) =>
            setFullName(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") next();
          }}
        />
      ),
    },
    {
      emoji: "🎂",
      title: "When's your birthday?",
      hint: "Your partner gets a gentle reminder — so your day is never forgotten.",
      body: (
        <>
          <input
            className={styles.input}
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) =>
              setBirthDate(e.target.value)
            }
          />

          {birthDateError && (
            <p className={styles.fieldError}>
              {birthDateError}
            </p>
          )}
        </>
      ),
    },
    {
      emoji: "📸",
      title: "Add a profile photo",
      hint: "Optional — you can always do this later in your profile.",
      body: (
        <div className={styles.avatarRow}>
          <button
            type="button"
            className={styles.avatarPick}
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your avatar"
              />
            ) : (
              "📷"
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />

          <span className={styles.avatarHint}>
            {uploading
              ? "Uploading…"
              : avatarUrl
                ? "Looking great! Tap to change."
                : "Tap to choose a photo"}
          </span>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className={styles.dots}>
          {steps.map((_, i) => (
            <span
              key={i}
              className={
                i === step
                  ? styles.dotActive
                  : i < step
                    ? styles.dotDone
                    : styles.dot
              }
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.emoji}>
            {current.emoji}
          </div>

          <h1>{current.title}</h1>

          <p className={styles.hint}>
            {current.hint}
          </p>

          <div className={styles.body}>
            {current.body}
          </div>
        </motion.div>

        <div className={styles.actions}>
          {step > 0 && (
            <Button
              variant="secondary"
              onClick={() => setStep((s) => s - 1)}
              disabled={finishing}
            >
              Back
            </Button>
          )}

          {step < 2 ? (
            <Button
              onClick={next}
              className={styles.primaryAction}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              loading={finishing}
              className={styles.primaryAction}
            >
              Start Our Story ❤️
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Onboarding;
