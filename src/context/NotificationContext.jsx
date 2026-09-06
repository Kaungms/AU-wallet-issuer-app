import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getIssuerConnectionSummary } from "../api/issuerApi";

const NotificationContext = createContext(null);

const VERIFICATION_REFRESH_INTERVAL = 30_000;

function getStoredPreferences() {
  try {
    const stored = localStorage.getItem("issuer-notification-preferences");

    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Unable to load notification preferences:", error);
  }

  return {
    verification: true,
    issuanceFailure: true,
    batchCompleted: true,
    system: true,
  };
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const [preferences, setPreferences] = useState(getStoredPreferences);

  useEffect(() => {
    const abortController = new AbortController();

    const loadVerificationNotifications = async () => {
      try {
        const { recentVerifications } = await getIssuerConnectionSummary({
          signal: abortController.signal,
        });

        setNotifications((current) => {
          const notificationMap = new Map();

          /*
              Keep everything already
              in notification history.
            */
          current.forEach((notification) => {
            notificationMap.set(notification.id, notification);
          });

          /*
              Add or update verification
              notifications returned by backend.
            */
          recentVerifications.forEach((verification) => {
            const id = getVerificationNotificationId(verification);

            const existing = notificationMap.get(id);

            notificationMap.set(id, {
              id,

              type: "verification",

              title: "Automatic verification completed",

              message: "Automatic student verification completed successfully.",

              programCode: verification.programCode,

              major: verification.major,

              verifiedAt: verification.verifiedAt,

              /*
                      Keep previous read state
                      if this notification
                      already existed.
                    */
              read: existing?.read ?? false,

              /*
                      Verification was successful,
                      so there is nothing to inspect.
                    */
              canView: false,
            });
          });

          /*
              Convert back to array and
              sort newest → oldest.
            */
          return Array.from(notificationMap.values()).sort(
            (a, b) => getNotificationTime(b) - getNotificationTime(a),
          );
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load verification notifications:", error);
        }
      }
    };

    loadVerificationNotifications();

    const refreshInterval = window.setInterval(
      loadVerificationNotifications,
      VERIFICATION_REFRESH_INTERVAL,
    );

    return () => {
      abortController.abort();

      window.clearInterval(refreshInterval);
    };
  }, []);

  const updatePreference = (name, value) => {
    setPreferences((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      localStorage.setItem(
        "issuer-notification-preferences",
        JSON.stringify(updated),
      );

      return updated;
    });
  };

  const isNotificationEnabled = (notification) => {
    switch (notification.type) {
      case "verification":
        return preferences.verification;

      case "issuance-failure":
        return preferences.issuanceFailure;

      case "batch-completed":
        return preferences.batchCompleted;

      case "system":
        return preferences.system;

      default:
        return true;
    }
  };

  const visibleNotifications = useMemo(
    () => notifications.filter(isNotificationEnabled),
    [notifications, preferences],
  );

  const unreadCount = useMemo(
    () =>
      visibleNotifications.filter((notification) => !notification.read).length,
    [visibleNotifications],
  );

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) =>
        isNotificationEnabled(notification)
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  };

  /*
    Used by other pages to create
    new notifications.

    Example types:
    - verification
    - issuance-failure
    - batch-completed
    - system
  */
  const addNotification = ({
    type,
    title,
    message,
    actionPage,
    errorDetails,
    errorCode,
  }) => {
    const isViewableError = type === "issuance-failure" || type === "system";

    const newNotification = {
      id: `notification:${Date.now()}:${Math.random().toString(36).slice(2)}`,

      type,

      title,

      message,

      createdAt: new Date().toISOString(),

      read: false,

      actionPage: actionPage || null,

      errorDetails: errorDetails || null,

      errorCode: errorCode || null,

      /*
        View appears only if:
        1. it is an error type
        2. actual error details exist
      */
      canView: isViewableError && Boolean(errorDetails),
    };

    setNotifications((current) =>
      [newNotification, ...current].sort(
        (a, b) => getNotificationTime(b) - getNotificationTime(a),
      ),
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        visibleNotifications,
        unreadCount,

        preferences,

        updatePreference,

        markAsRead,
        markAllAsRead,

        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/*
  Used to sort all notification
  types by date/time.
*/
function getNotificationTime(notification) {
  const value = notification.createdAt || notification.verifiedAt;

  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function getVerificationNotificationId(verification) {
  return `verification:${verification.programCode}:${verification.verifiedAt}`;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
