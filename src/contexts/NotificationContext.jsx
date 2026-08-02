import {
  createContext,
  useCallback,
  useState,
} from "react";

import Notification from "../components/Notification/Notification";

export const NotificationContext =
  createContext();

export function NotificationProvider({
  children,
}) {
  const [notification, setNotification] =
    useState(null);

  //---------------------------------------
  // Base Notification
  //---------------------------------------

  const showNotification =
    useCallback((options) => {
      setNotification({
        id: Date.now(),
        duration: 4000,
        ...options,
      });
    }, []);

  //---------------------------------------
  // Hide Notification
  //---------------------------------------

  const hideNotification =
    useCallback(() => {
      setNotification(null);
    }, []);

  //---------------------------------------
  // Helper API
  //---------------------------------------

  const notify = {
    success: (
      title,
      message = ""
    ) =>
      showNotification({
        type: "success",
        title,
        message,
      }),

    error: (
      title,
      message = ""
    ) =>
      showNotification({
        type: "error",
        title,
        message,
      }),

    warning: (
      title,
      message = ""
    ) =>
      showNotification({
        type: "warning",
        title,
        message,
      }),

    info: (
      title,
      message = ""
    ) =>
      showNotification({
        type: "info",
        title,
        message,
      }),

    achievement: (
      achievement
    ) =>
      showNotification({
        type: "achievement",
        title:
          "🏆 Achievement Unlocked!",
        message: achievement,
      }),

    favorite: () =>
      showNotification({
        type: "success",
        title:
          "⭐ Added to Favorites",
        message:
          "This memory has been added to your favorites.",
      }),

    streak: (days) =>
      showNotification({
        type: "achievement",
        title:
          "🔥 Memory Streak!",
        message: `${days} day streak achieved!`,
      }),
  };

  //---------------------------------------

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
        notify,
      }}
    >
      {children}

      <Notification
        notification={notification}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
}