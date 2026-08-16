import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getIssuerConnectionSummary } from "../api/issuerApi";

const NotificationContext = createContext(null);

const VERIFICATION_REFRESH_INTERVAL = 30_000;

function getStoredPreferences() {
  try {
    const stored = localStorage.getItem(
      "issuer-notification-preferences"
    );

    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(
      "Unable to load notification preferences:",
      error
    );
  }

  return {
    verification: true,
    issuanceFailure: true,
    batchCompleted: true,
    system: true,
  };
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] =
    useState([]);

  const [preferences, setPreferences] =
    useState(getStoredPreferences);

  useEffect(() => {
    const abortController = new AbortController();

    const loadVerificationNotifications = async () => {
      try {
        const { recentVerifications } = await getIssuerConnectionSummary({
          signal: abortController.signal,
        });

        setNotifications((current) => {
          const existingNotifications = new Map(
            current.map((notification) => [notification.id, notification]),
          );

          const verificationNotifications = recentVerifications.map(
            (verification) => {
              const id = getVerificationNotificationId(verification);
              const existing = existingNotifications.get(id);

              return {
                id,
                type: "verification",
                title: "Automatic verification completed",
                programCode: verification.programCode,
                major: verification.major,
                verifiedAt: verification.verifiedAt,
                read: existing?.read ?? false,
              };
            },
          );

          const fetchedIds = new Set(
            verificationNotifications.map((notification) => notification.id),
          );

          return [
            ...verificationNotifications,
            ...current.filter((notification) => !fetchedIds.has(notification.id)),
          ];
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
        JSON.stringify(updated)
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
    () =>
      notifications.filter(
        isNotificationEnabled
      ),
    [notifications, preferences]
  );

  const unreadCount = useMemo(
    () =>
      visibleNotifications.filter(
        (notification) => !notification.read
      ).length,
    [visibleNotifications]
  );

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
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
          : notification
      )
    );
  };

  const addNotification = ({ type, title, message, actionPage }) => {
    setNotifications((current) => [
      {
        id: `notification:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        type,
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
        actionPage,
      },
      ...current,
    ]);
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

function getVerificationNotificationId(verification) {
  return `verification:${verification.programCode}:${verification.verifiedAt}`;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}
