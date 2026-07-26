import { Bell, ChevronDown, Search } from "lucide-react";

const pageTitles = {
  dashboard: {
    title: "Dashboard",
    description: "Overview of credential issuing activities.",
  },

  records: {
    title: "Student Records",
    description: "Review and manage student academic records.",
  },

  claims: {
    title: "Claims Review",
    description: "Review credential claims submitted by students.",
  },

  offer: {
    title: "Credential Offer",
    description: "Create and send new credential offers.",
  },

  credentials: {
    title: "Credentials",
    description: "Track issued and pending credentials.",
  },

  settings: {
    title: "Settings",
    description: "Manage issuer profile and system configuration.",
  },
};

function Header({ activePage }) {
  const currentPage = pageTitles[activePage] ?? pageTitles.dashboard;

  return (
    <header className="main-header">
      <div>
        <p className="main-header-label">Registrar Workspace</p>

        <h2 className="main-header-title">{currentPage.title}</h2>

        <p className="main-header-description">
          {currentPage.description}
        </p>
      </div>

      <div className="main-header-actions">
        <div className="header-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search records..."
            aria-label="Search records"
          />
        </div>

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