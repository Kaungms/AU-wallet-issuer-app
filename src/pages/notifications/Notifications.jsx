import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  CheckSquare,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useNotifications } from "../../context/NotificationContext";

import "./notifications.css";

function Notifications({ onPageChange }) {
  const {
    visibleNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const unreadCount = visibleNotifications.filter(
    (notification) => !notification.read,
  ).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return visibleNotifications.filter((notification) => !notification.read);
    }

    return visibleNotifications;
  }, [visibleNotifications, activeFilter]);

  const allVisibleSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((notification) =>
      selectedIds.includes(notification.id),
    );

  const handleNotificationClick = (notification) => {
    if (selectionMode) {
      handleToggleSelect(notification.id);
      return;
    }

    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionPage) {
      onPageChange?.(
        notification.actionPage,
        notification.studentNumber ? "single" : null,
        notification.studentNumber || "",
      );
    }
  };

  const handleNotificationKeyDown = (event, notification) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNotificationClick(notification);
    }
  };

  const handleViewError = (event, notification) => {
    event.stopPropagation();

    if (!notification.read) {
      markAsRead(notification.id);
    }

    setExpandedNotificationId((current) =>
      current === notification.id ? null : notification.id,
    );
  };

  const handleToggleSelect = (notificationId) => {
    setSelectedIds((current) =>
      current.includes(notificationId)
        ? current.filter((id) => id !== notificationId)
        : [...current, notificationId],
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        const visibleIds = new Set(
          filteredNotifications.map((notification) => notification.id),
        );
        return current.filter((id) => !visibleIds.has(id));
      }

      return [
        ...new Set([
          ...current,
          ...filteredNotifications.map((notification) => notification.id),
        ]),
      ];
    });
  };

  const handleEnterSelectionMode = () => {
    setSelectionMode(true);
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    deleteNotifications(selectedIds);
    setSelectedIds([]);
    setSelectionMode(false);
  };

  return (
    <div className="notifications-page">
      <section className="notifications-card">
        <div className="notifications-toolbar">
          <div className="notifications-filter-tabs">
            <button
              type="button"
              className={`notifications-filter-tab ${
                activeFilter === "all" ? "notifications-filter-active" : ""
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All
              <span>{visibleNotifications.length}</span>
            </button>

            <button
              type="button"
              className={`notifications-filter-tab ${
                activeFilter === "unread" ? "notifications-filter-active" : ""
              }`}
              onClick={() => setActiveFilter("unread")}
            >
              Unread
              <span>{unreadCount}</span>
            </button>
          </div>

          {selectionMode ? (
            <div className="notifications-toolbar-actions">
              <button
                type="button"
                className="notifications-select-all"
                onClick={handleToggleSelectAll}
                disabled={filteredNotifications.length === 0}
              >
                <CheckSquare size={14} />
                {allVisibleSelected ? "Deselect all" : "Select all"}
              </button>

              <span className="notifications-selected-count">
                {selectedIds.length} selected
              </span>

              <button
                type="button"
                className="notifications-delete-selected"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
              >
                <Trash2 size={14} />
                Delete
              </button>

              <button
                type="button"
                className="notifications-cancel-select"
                onClick={handleExitSelectionMode}
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          ) : (
            <div className="notifications-toolbar-actions">
              <button
                type="button"
                className="notifications-mark-all"
                onClick={handleEnterSelectionMode}
                disabled={visibleNotifications.length === 0}
              >
                <Trash2 size={14} />
                Select
              </button>

              <button
                type="button"
                className="notifications-mark-all"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check size={15} />
                Mark all as read
              </button>
            </div>
          )}
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <Bell size={24} />

              <h2>No notifications</h2>

              <p>There are no notifications to display.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                expanded={expandedNotificationId === notification.id}
                selectionMode={selectionMode}
                selected={selectedIds.includes(notification.id)}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(event) =>
                  handleNotificationKeyDown(event, notification)
                }
                onView={(event) => handleViewError(event, notification)}
                onToggleSelect={() => handleToggleSelect(notification.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function NotificationItem({
  notification,
  expanded,
  selectionMode,
  selected,
  onClick,
  onKeyDown,
  onView,
  onToggleSelect,
}) {
  const { Icon, iconClass } = getNotificationAppearance(notification.type);

  /*
    View appears ONLY when there is
    something useful for the admin to inspect.
  */
  const canViewError =
    notification.canView === true && Boolean(notification.errorDetails);

  return (
    <div
      className={`notification-item ${
        !notification.read ? "notification-item-unread" : ""
      } ${selectionMode ? "notification-item-selectable" : ""} ${
        selected ? "notification-item-selected" : ""
      }`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      {selectionMode && (
        <input
          type="checkbox"
          className="notification-select-checkbox"
          checked={selected}
          aria-label={`Select notification: ${notification.title}`}
          onClick={(event) => event.stopPropagation()}
          onChange={onToggleSelect}
        />
      )}

      <div className={`notification-item-icon ${iconClass}`}>
        <Icon size={17} />
      </div>

      <div className="notification-item-content">
        <div className="notification-title-row">
          <h3>{notification.title}</h3>

          {!notification.read && (
            <span className="notification-unread-dot" aria-label="Unread" />
          )}
        </div>

        {notification.message && <p>{notification.message}</p>}

        {notification.programCode && (
          <div className="notification-verification-details">
            <span>
              Program: <strong>{notification.programCode}</strong>
            </span>

            {notification.major && (
              <>
                <span>•</span>

                <span>
                  Major: <strong>{notification.major}</strong>
                </span>
              </>
            )}
          </div>
        )}

        {notification.verifiedAt && (
          <time
            className="notification-time"
            dateTime={notification.verifiedAt}
          >
            {formatNotificationDate(notification.verifiedAt)}
          </time>
        )}

        {notification.createdAt && (
          <time className="notification-time" dateTime={notification.createdAt}>
            {formatNotificationDate(notification.createdAt)}
          </time>
        )}

        {notification.issuedAt && (
          <time className="notification-time" dateTime={notification.issuedAt}>
            Issued {formatNotificationDate(notification.issuedAt)}
          </time>
        )}

        {expanded && notification.errorDetails && (
          <div className="notification-error-details">
            <div className="notification-error-heading">
              <AlertTriangle size={15} />

              <strong>Error Details</strong>
            </div>

            {notification.errorCode && (
              <div className="notification-error-code">
                <span>Error code</span>

                <strong>{notification.errorCode}</strong>
              </div>
            )}

            <p>{notification.errorDetails}</p>
          </div>
        )}
      </div>

      {!selectionMode && canViewError && (
        <button
          type="button"
          className="notification-view-label"
          onClick={onView}
        >
          {expanded ? "Hide" : "View"}
        </button>
      )}
    </div>
  );
}

function getNotificationAppearance(type) {
  switch (type) {
    case "verification":
      return {
        Icon: ShieldCheck,
        iconClass: "notification-icon-verification",
      };

    case "issuance-failure":
      return {
        Icon: AlertTriangle,
        iconClass: "notification-icon-warning",
      };

    case "system":
      return {
        Icon: AlertTriangle,
        iconClass: "notification-icon-system",
      };

    case "batch-completed":
    case "credential-issued":
    case "vc-created":
      return {
        Icon: CheckCircle2,
        iconClass: "notification-icon-success",
      };

    default:
      return {
        Icon: CheckCircle2,
        iconClass: "notification-icon-success",
      };
  }
}

function formatNotificationDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default Notifications;
