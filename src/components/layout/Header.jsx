import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

function Header({
  title,
  description,
  onPageChange,
}) {
  const { unreadCount } = useNotifications();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        profileRef.current?.querySelector(".header-profile-button")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="main-header">
      <div>
        <p className="main-header-label">
          Registrar Workspace
        </p>

        <h2 className="main-header-title">
          {title}
        </h2>

        <p className="main-header-description">
          {description}
        </p>
      </div>

      <div className="main-header-actions">

        <button
          type="button"
          className="header-icon-button"
          aria-label="Open notifications"
          onClick={() =>
            onPageChange?.("notifications")
          }
        >
          <Bell size={19} />

          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9
                ? "9+"
                : unreadCount}
            </span>
          )}
        </button>

        <div className="header-profile" ref={profileRef}>
        <button
          type="button"
          className="header-profile-button"
          aria-expanded={menuOpen}
          aria-controls="header-profile-menu"
          aria-label="AU Registrar account menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <div className="header-profile-avatar">
            AR
          </div>

          <div className="header-profile-details">
            <span className="header-profile-name">
              AU Registrar
            </span>

            <span className="header-profile-role">
              Issuer
            </span>
          </div>

          <ChevronDown size={16} />
        </button>
        {menuOpen && (
          <div className="header-profile-menu" id="header-profile-menu">
            <button type="button" onClick={() => {
              setMenuOpen(false);
              onPageChange?.("settings");
            }}>
              <Settings size={16} /> Settings
            </button>
            <button type="button" onClick={() => {
              setMenuOpen(false);
              if (window.confirm("Log out of the AU Wallet Issuer Portal?")) logout();
            }}>
              <LogOut size={16} /> Log out
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}

export default Header;
