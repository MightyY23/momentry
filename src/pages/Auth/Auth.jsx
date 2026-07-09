import { useState } from "react";

import styles from "./Auth.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";
import Heading from "../../ui/Heading/Heading";
import Text from "../../ui/Text/Text";

function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <Heading>
            {isSignUp ? "Create your account" : "Welcome back"}
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
            />

            <input
              className={styles.input}
              type="password"
              placeholder="Password"
            />

            <Button>
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </div>

          <button
            className={styles.switchButton}
            onClick={() => setIsSignUp(!isSignUp)}
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