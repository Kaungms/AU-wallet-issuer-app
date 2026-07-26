import {
  FilePlus2,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "students",
    label: "Student Data",
    icon: FolderOpen,
  },
  {
    id: "issue-transcript",
    label: "Issue Transcript",
    icon: FilePlus2,
  },
];

function Sidebar({ activePage, onPageChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <GraduationCap size={24} />
        </div>

        <div>
          <p className="sidebar-brand-small">AU Wallet</p>
          <h1 className="sidebar-brand-title">Issuer Portal</h1>
        </div>
      </div>

      <nav className="sidebar-navigation">
        <p className="sidebar-section-label">Workspace</p>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${
                isActive ? "sidebar-link-active" : ""
              }`}
              onClick={() => onPageChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`sidebar-link ${
            activePage === "settings" ? "sidebar-link-active" : ""
          }`}
          onClick={() => onPageChange("settings")}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">AR</div>

          <div>
            <p className="sidebar-user-name">AU Registrar</p>
            <p className="sidebar-user-role">Credential Issuer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;