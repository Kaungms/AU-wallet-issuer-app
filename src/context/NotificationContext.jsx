import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const NotificationContext = createContext(null);

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "verification",
    title: "Automatic verification completed",
    programCode: "BSCS",
    major: "Computer Science",
    verifiedAt: "2026-08-16T15:42:00",
    read: false,
  },
  {
    id: 2,
    type: "verification",
    title: "Automatic verification completed",
    programCode: "BSIT",
    major: "Information Technology",
    verifiedAt: "2026-08-16T14:18:00",
    read: false,
  },
  {
    id: 3,
    type: "batch-completed",
    title: "Batch issuance completed",
    message:
      "391 transcript credentials were issued for the 24 May 2026 graduation group.",
    createdAt: "2026-08-16T13:05:00",
    read: false,
    actionPage: "issued-transcripts",
  },
  {
    id: 4,
    type: "issuance-failure",
    title: "Transcript issuance failed",
    message:
      "A transcript issuance operation could not be completed.",
    createdAt: "2026-08-15T16:20:00",
    read: true,
  },
  {
    id: 5,
    type: "system",
    title: "Issuer service connection restored",
    message:
      "The credential issuer service is available again.",
    createdAt: "2026-08-15T10:15:00",
    read: true,
  },
];

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
    useState(INITIAL_NOTIFICATIONS);

  const [preferences, setPreferences] =
    useState(getStoredPreferences);

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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
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