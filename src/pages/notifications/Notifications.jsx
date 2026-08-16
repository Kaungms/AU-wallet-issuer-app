import { useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  FileCheck2,
  Server,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { useNotifications } from "../../context/NotificationContext";

import "./notifications.css";

function Notifications({ onPageChange }) {
  const {
    visibleNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [filter, setFilter] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return visibleNotifications.filter(
        (notification) => !notification.read
      );
    }

    return visibleNotifications;
  }, [visibleNotifications, filter]);

  const unreadCount =
    visibleNotifications.filter(
      (notification) => !notification.read
    ).length;

  const handleNotificationClick = (
    notification
  ) => {
    markAsRead(notification.id);

    if (notification.actionPage) {
      onPageChange?.(
        notification.actionPage
      );
    }
  };

  return (
    <div className="notifications-page">
      <section className="notifications-card">
        <div className="notifications-toolbar">
          <div className="notifications-filter-tabs">
            <button
              type="button"
              className={`notifications-filter-tab ${
                filter === "all"
                  ? "notifications-filter-active"
                  : ""
              }`}
              onClick={() => setFilter("all")}
            >
              All
              <span>
                {visibleNotifications.length}
              </span>
            </button>

            <button
              type="button"
              className={`notifications-filter-tab ${
                filter === "unread"
                  ? "notifications-filter-active"
                  : ""
              }`}
              onClick={() =>
                setFilter("unread")
              }
            >
              Unread
              <span>{unreadCount}</span>
            </button>
          </div>

          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(
              (notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="notifications-empty">
            <Bell size={30} />

            <h2>No notifications</h2>

            <p>
              There are no notifications matching
              this view.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}) {
  const details =
    getNotificationDetails(notification);

  const Icon = details.icon;

  return (
    <button
      type="button"
      className={`notification-item ${
        !notification.read
          ? "notification-item-unread"
          : ""
      }`}
      onClick={onClick}
    >
      <div
        className={`notification-item-icon ${details.iconClass}`}
      >
        <Icon size={17} />
      </div>

      <div className="notification-item-content">
        <div className="notification-title-row">
          <h3>{notification.title}</h3>

          {!notification.read && (
            <span className="notification-unread-dot" />
          )}
        </div>

        {notification.type ===
        "verification" ? (
          <>
            <p>
              Automatic student verification
              completed successfully.
            </p>

            <div className="notification-verification-details">
              <span>
                Program:{" "}
                <strong>
                  {notification.programCode}
                </strong>
              </span>

              <span>•</span>

              <span>
                Major:{" "}
                <strong>
                  {notification.major}
                </strong>
              </span>
            </div>
          </>
        ) : (
          <p>{notification.message}</p>
        )}

        <span className="notification-time">
          {formatNotificationDate(
            notification.verifiedAt ||
              notification.createdAt
          )}
        </span>
      </div>

      {notification.actionPage && (
        <span className="notification-view-label">
          View
        </span>
      )}
    </button>
  );
}

function getNotificationDetails(notification) {
  switch (notification.type) {
    case "verification":
      return {
        icon: ShieldCheck,
        iconClass:
          "notification-icon-verification",
      };

    case "batch-completed":
      return {
        icon: FileCheck2,
        iconClass:
          "notification-icon-success",
      };

    case "issuance-failure":
      return {
        icon: TriangleAlert,
        iconClass:
          "notification-icon-warning",
      };

    case "system":
      return {
        icon: Server,
        iconClass:
          "notification-icon-system",
      };

    default:
      return {
        icon: CheckCircle2,
        iconClass:
          "notification-icon-verification",
      };
  }
}

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

export default Notifications;