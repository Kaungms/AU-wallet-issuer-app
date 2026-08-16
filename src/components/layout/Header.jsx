import { Bell, ChevronDown, Search } from "lucide-react";

function Header({ title, description }) {
  return (
    <header className="main-header">
      <div>
        <p className="main-header-label">Registrar Workspace</p>

        <h2 className="main-header-title">{title}</h2>

        <p className="main-header-description">
          {description}
        </p>
      </div>

      <div className="main-header-actions">

        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <button type="button" className="header-profile-button">
          <div className="header-profile-avatar">AR</div>

          <div className="header-profile-details">
            <span className="header-profile-name">AU Registrar</span>
            <span className="header-profile-role">Issuer</span>
          </div>

          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}

export default Header;
