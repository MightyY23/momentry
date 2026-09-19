import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  BookHeart,
  Mail,
  Lock,
} from "lucide-react";

import styles from "./Auth.module.css";

import { supabase } from "../../services/supabase/supabaseClient";
import { userHasStory } from "../../services/story/hasStory";
import { getPendingInvitation } from "../../services/invitation/getPendingInvitation";
import useNotification from "../../hooks/useNotification";

function Auth({ resetMode = false }) {
  const navigate = useNavigate();

  const notify = useNotification();

  const [isSignUp, setIsSignUp] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  //---------------------------------------
  // Forgot password states
  //---------------------------------------

  // auth | forgot | reset
  const [mode, setMode] = useState(
    resetMode ? "reset" : "auth"
  );

  const [resetSent, setResetSent] =
    useState(false);

  //---------------------------------------
  // OTP email verification states
  //---------------------------------------

  const [otpCode, setOtpCode] = useState("");

  const [verifying, setVerifying] =
    useState(false);

  const [resendCooldown, setResendCooldown] =
    useState(0);

  // Tick the resend cooldown down once a
  // second while it's active.
  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setTimeout(
      () =>
        setResendCooldown(
          (s) => s - 1
        ),
      1000
    );

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  //---------------------------------------
  // Redirect after sign-in
  //---------------------------------------

  async function handleSuccessfulLogin() {
    try {
      // 1. Check if the user has a pending invitation
      // (invitations are stored lowercased — the
      // lookup must match that exactly).
      const invitation = await getPendingInvitation(
        email.trim().toLowerCase()
      );

      if (invitation) {
        navigate("/accept-invitation");
        return;
      }

      // 1.5. First login: finish onboarding
      // (name + birthday) before anything else.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { getProfile } = await import(
          "../../services/profile/updateProfile"
        );

        const profile = await getProfile(
          user.id
        );

        if (
          profile &&
          profile.onboarding_completed === false
        ) {
          navigate("/onboarding");
          return;
        }
      }

      // 2. Check if the user already belongs to a story
      const hasStory =
        await userHasStory();

      if (hasStory) {
        navigate("/home");
      } else {
        navigate("/create-story");
      }
    } catch (error) {
      console.error("Login flow error:", error);
      notify.error(
        "Couldn't load your account",
        "Please try again in a moment."
      );
    }
  }

  //---------------------------------------
  // Submit (sign in / sign up)
  //---------------------------------------

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    if (!email || !password) {
      notify.error(
        "Missing details",
        "Please fill in both email and password."
      );
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Supabase stores emails lowercased —
        // normalize here so invitation lookups
        // and profile rows always match.
        const authEmail =
          email.trim().toLowerCase();

        const { data, error } =
          await supabase.auth.signUp({
            email: authEmail,
            password,
          });

        if (error) {
          notify.error(
            "Sign up failed",
            error.message
          );
        } else if (data.session) {
          // Email confirmation is disabled (or the
          // address is already verified): continue
          // straight into the invitation /
          // onboarding / story routing instead of
          // dead-ending on a toast.
          notify.success(
            "Account created!",
            "Welcome to Momentry 💛"
          );

          await handleSuccessfulLogin();
        } else {
          // Email confirmation is on: a 6-digit
          // OTP code is on its way. Ask for it
          // inline instead of dead-ending on a
          // "check your email" toast.
          setMode("verify");
          setOtpCode("");
          setResendCooldown(60);

          notify.info(
            "Check your inbox 📬",
            `We sent a 6-digit code to ${authEmail}.`
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword(
            {
              email: email
                .trim()
                .toLowerCase(),
              password,
            }
          );

        if (error) {
          notify.error(
            "Sign in failed",
            error.message
          );
        } else {
          await handleSuccessfulLogin();
        }
      }
    } catch (error) {
      console.error(error);
      notify.error(
        "Something went wrong",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  //---------------------------------------
  // Verify the signup OTP code
  //---------------------------------------

  async function handleVerify(event) {
    event?.preventDefault?.();

    const token = otpCode.replace(/\D/g, "");

    if (token.length !== 6) {
      notify.error(
        "Enter the code",
        "Type the 6-digit code from your email."
      );
      return;
    }

    setVerifying(true);

    try {
      const { error } =
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),

          token,

          type: "signup",
        });

      if (error) {
        notify.error(
          "Couldn't verify",
          error.message
        );

        return;
      }

      notify.success(
        "Email verified!",
        "Welcome to Momentry 💛"
      );

      await handleSuccessfulLogin();
    } catch (error) {
      console.error(error);

      notify.error(
        "Something went wrong",
        "Please try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  //---------------------------------------
  // Resend the OTP code (60s cooldown —
  // Supabase's built-in email is heavily
  // rate-limited, so never spam it)
  //---------------------------------------

  async function handleResendCode() {
    if (resendCooldown > 0 || verifying) {
      return;
    }

    try {
      const { error } =
        await supabase.auth.resend({
          email: email.trim().toLowerCase(),

          type: "signup",
        });

      if (error) {
        notify.error(
          "Couldn't resend",
          error.message
        );

        return;
      }

      setResendCooldown(60);

      notify.success(
        "Code sent again",
        "Give it a few seconds to arrive."
      );
    } catch (error) {
      console.error(error);

      notify.error(
        "Something went wrong",
        "Please try again."
      );
    }
  }

  //---------------------------------------
  // Send reset email
  //---------------------------------------

  async function handleSendReset(event) {
    event?.preventDefault?.();

    if (!email) {
      notify.error(
        "Missing email",
        "Enter your email and we'll send a reset link."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              window.location.origin +
              "/reset-password",
          }
        );

      if (error) {
        notify.error(
          "Couldn't send reset email",
          error.message
        );
      } else {
        setResetSent(true);
      }
    } catch (error) {
      console.error(error);
      notify.error(
        "Something went wrong",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  //---------------------------------------
  // Set new password (recovery session)
  //---------------------------------------

  async function handleSetNewPassword(event) {
    event?.preventDefault?.();

    if (password.length < 6) {
      notify.error(
        "Password too short",
        "Use at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        notify.error(
          "Couldn't update password",
          error.message
        );
      } else {
        notify.success(
          "Password updated!",
          "You're signed in with your new password."
        );

        const hasStory =
          await userHasStory();

        navigate(
          hasStory ? "/home" : "/create-story"
        );
      }
    } catch (error) {
      console.error(error);
      notify.error(
        "Something went wrong",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  //---------------------------------------
  // Brand panel (plain JSX, not a
  // nested component — the React
  // compiler forbids components
  // created during render)
  //---------------------------------------

  const brandPanel = (
    <div className={styles.brand}>
      <div className={styles.brandInner}>
        <div className={styles.brandLogo}>
          <BookHeart size={26} />

          <span>Momentry</span>
        </div>

        <h1 className={styles.brandTitle}>
          Every memory deserves
          <br />
          <em>its own chapter.</em>
        </h1>

        <p className={styles.brandText}>
          Turn scattered photos, dates and
          places into a beautiful storybook
          you can read forever.
        </p>

        {/* Floating memory cards */}

        <div className={styles.cards}>
          <motion.div
            className={`${styles.card} ${styles.cardOne}`}
            animate={{
              y: [0, -12, 0],
              rotate: [-4, -2, -4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className={styles.cardEmoji}>
              📸
            </span>

            <div>
              <strong>Kochi, Kerala</strong>

              <span>First trip together</span>
            </div>
          </motion.div>

          <motion.div
            className={`${styles.card} ${styles.cardTwo}`}
            animate={{
              y: [0, 10, 0],
              rotate: [3, 5, 3],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
          >
            <span className={styles.cardEmoji}>
              ❤️
            </span>

            <div>
              <strong>2 Years</strong>

              <span>and counting</span>
            </div>
          </motion.div>

          <motion.div
            className={`${styles.card} ${styles.cardThree}`}
            animate={{
              y: [0, -9, 0],
              rotate: [-2, -4, -2],
            }}
            transition={{
              duration: 5.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.1,
            }}
          >
            <span className={styles.cardEmoji}>
              📖
            </span>

            <div>
              <strong>Our Story</strong>

              <span>12 chapters written</span>
            </div>
          </motion.div>
        </div>

        <p className={styles.brandFootnote}>
          ✨ AI chapters · Memory map ·
          Shareable storybooks
        </p>
      </div>
    </div>
  );

  //---------------------------------------
  // Forms (plain JSX fragments, not
  // nested components)
  //---------------------------------------

  const authForm = (
    <>
        <h2 className={styles.formTitle}>
          {isSignUp
            ? "Create your account"
            : "Welcome back"}
        </h2>

        <p className={styles.formSubtitle}>
          {isSignUp
            ? "Your story deserves a safe place to live."
            : "Sign in to continue your story."}
        </p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <label className={styles.field}>
            <Mail
              size={18}
              className={styles.fieldIcon}
            />

            <input
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </label>

          <label className={styles.field}>
            <Lock
              size={18}
              className={styles.fieldIcon}
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Password"
              autoComplete={
                isSignUp
                  ? "new-password"
                  : "current-password"
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="button"
              className={styles.eye}
              onClick={() =>
                setShowPassword((v) => !v)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </label>

          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div className={styles.formLinks}>
          <button
            className={styles.linkButton}
            onClick={() => setMode("forgot")}
          >
            Forgot password?
          </button>

          <span className={styles.dividerDot}>
            ·
          </span>

          <button
            className={styles.linkButton}
            onClick={() =>
              setIsSignUp((v) => !v)
            }
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Create One"}
          </button>
        </div>

        {isSignUp && mode === "auth" && (
          <p className={styles.legalNote}>
            By creating an account you agree to our{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        )}
      </>
  );

  const forgotForm = (
    <>
        {resetSent ? (
          <>
            <h2 className={styles.formTitle}>
              Check your inbox 📬
            </h2>

            <p className={styles.formSubtitle}>
              We sent a password reset link to{" "}
              <strong>{email}</strong>. Follow it
              to set a new password.
            </p>

            <button
              className={styles.submit}
              onClick={() => {
                setMode("auth");
                setResetSent(false);
              }}
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <h2 className={styles.formTitle}>
              Reset your password
            </h2>

            <p className={styles.formSubtitle}>
              Enter your email and we'll send
              you a link to set a new password.
            </p>

            <form
              className={styles.form}
              onSubmit={handleSendReset}
            >
              <label className={styles.field}>
                <Mail
                  size={18}
                  className={styles.fieldIcon}
                />

                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </label>

              <button
                type="submit"
                className={styles.submit}
                disabled={loading}
              >
                {loading
                  ? "Sending…"
                  : "Send Reset Link"}
              </button>
            </form>

            <div className={styles.formLinks}>
              <button
                className={styles.linkButton}
                onClick={() => setMode("auth")}
              >
                ← Back to Sign In
              </button>
            </div>
          </>
        )}
      </>
  );

  const verifyForm = (
    <>
      <h2 className={styles.formTitle}>
        Confirm it's you ✉️
      </h2>

      <p className={styles.formSubtitle}>
        Enter the 6-digit code we sent to{" "}
        <strong>{email}</strong>.
      </p>

      <form
        className={styles.form}
        onSubmit={handleVerify}
      >
        <label className={styles.field}>
          <input
            className={styles.otpInput}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="––––––"
            maxLength={6}
            value={otpCode}
            onChange={(e) =>
              setOtpCode(
                e.target.value.replace(/\D/g, "")
              )
            }
            aria-label="6-digit verification code"
          />
        </label>

        <button
          type="submit"
          className={styles.submit}
          disabled={
            verifying ||
            otpCode.replace(/\D/g, "").length !== 6
          }
        >
          {verifying
            ? "Verifying…"
            : "Verify & Continue"}
        </button>
      </form>

      <div className={styles.formLinks}>
        <button
          className={styles.linkButton}
          onClick={handleResendCode}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0
            ? `Resend code (${resendCooldown}s)`
            : "Resend code"}
        </button>

        <span className={styles.dividerDot}>
          ·
        </span>

        <button
          className={styles.linkButton}
          onClick={() => setMode("auth")}
        >
          Wrong email? Go back
        </button>
      </div>
    </>
  );

  const resetForm = (
    <>
        <h2 className={styles.formTitle}>
          Set a new password
        </h2>

        <p className={styles.formSubtitle}>
          Choose a new password for your
          account.
        </p>

        <form
          className={styles.form}
          onSubmit={handleSetNewPassword}
        >
          <label className={styles.field}>
            <Lock
              size={18}
              className={styles.fieldIcon}
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="New password"
              autoComplete="new-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="button"
              className={styles.eye}
              onClick={() =>
                setShowPassword((v) => !v)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </label>

          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
          >
            {loading
              ? "Saving…"
              : "Save New Password"}
          </button>
        </form>
      </>
  );

  //---------------------------------------
  // UI
  //---------------------------------------

  return (
    <div className={styles.page}>
      {brandPanel}

      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.mobileLogo}>
            <BookHeart size={22} />

            <span>Momentry</span>
          </div>

          {mode === "auth"
            ? authForm
            : mode === "verify"
            ? verifyForm
            : mode === "forgot"
            ? forgotForm
            : resetForm}
        </div>
      </div>
    </div>
  );
}

export default Auth;
