import { useState } from "react";

import styles from "./Auth.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";
import Heading from "../../ui/Heading/Heading";
import Text from "../../ui/Text/Text";

import { supabase } from "../../services/supabase/supabaseClient";

function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert(error.message);
        } else {
          alert(
            "Account created successfully!\n\nPlease check your email to verify your account."
          );
        }
      } else {
        alert("Login will be implemented in the next commit.");
      }
    } catch (err) {
      alert("Something went wrong.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <Heading>
            {isSignUp
              ? "Create your account"
              : "Welcome back"}
          </Heading>

          <Text secondary>
            {isSignUp
              ? "Your story deserves a safe place to live."
              : "Sign in to continue your story."}
          </Text>

          <div className={styles.form}>
            <input
              className={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <Button
              onClick={handleSubmit}
            >
              {loading
                ? "Please wait..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </div>

          <button
            className={styles.switchButton}
            onClick={() =>
              setIsSignUp(!isSignUp)
            }
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Create One"}
          </button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default Auth;