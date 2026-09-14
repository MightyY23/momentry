import { Component } from "react";

import styles from "./ErrorBoundary.module.css";

/**
 * Catches unexpected React crashes anywhere
 * below the router and shows a friendly
 * recovery screen instead of a blank page.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "ErrorBoundary caught:",
      error,
      errorInfo
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false });

    window.location.assign("/home");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <span className={styles.icon}>
            📖
          </span>

          <h1>
            Something interrupted
            <br />
            your story.
          </h1>

          <p>
            An unexpected error occurred.
            Your memories are safe — try
            reloading the page.
          </p>

          <div className={styles.actions}>
            <button
              className={styles.primary}
              onClick={this.handleReload}
            >
              Reload Page
            </button>

            <button
              className={styles.secondary}
              onClick={this.handleGoHome}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
