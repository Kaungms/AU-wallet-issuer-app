import { useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  Database,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
  X,
} from "lucide-react";

import { useNotifications } from "../../context/NotificationContext";

import "./settings.css";

function Settings() {
  const [confirmSingleIssue, setConfirmSingleIssue] =
    useState(true);

  const [confirmBatchIssue, setConfirmBatchIssue] =
    useState(true);

  const [defaultWalletFilter, setDefaultWalletFilter] =
    useState("all");

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const {
    preferences,
    updatePreference,
  } = useNotifications();

  const handleLogout = () => {
    /*
      Frontend logout placeholder.

      Later, connect this to your actual
      authentication/session flow.
    */

    localStorage.removeItem("authToken");
    sessionStorage.clear();

    setShowLogoutModal(false);

    window.location.href = "/";
  };

  return (
    <div className="settings-page">
      {/* =====================================
          PAGE HEADING
      ===================================== */}

      <div className="settings-page-heading">
        <p className="settings-eyebrow">
          Issuer Configuration
        </p>

        <h1>Settings</h1>

        <p>
          Manage issuer preferences, system
          information, notifications, and account
          security.
        </p>
      </div>

      <div className="settings-content">
        {/* =====================================
            ISSUER INFORMATION
        ===================================== */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon">
              <Building2 size={19} />
            </div>

            <div>
              <h2>Issuer Information</h2>

              <p>
                University and credential issuer
                information used by the portal.
              </p>
            </div>
          </div>

          <div className="settings-info-list">
            <SettingsInfoRow
              label="Institution"
              value="Assumption University"
            />

            <SettingsInfoRow
              label="Issuer"
              value="AU Registrar"
            />

            <SettingsInfoRow
              label="Issuer DID"
              value="did:web:au.edu:registrar"
              mono
            />

            <SettingsInfoRow
              label="Credential Type"
              value="Academic Transcript"
            />
          </div>
        </section>

        {/* =====================================
            SYSTEM CONNECTIONS
        ===================================== */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon">
              <Database size={19} />
            </div>

            <div>
              <h2>System Connections</h2>

              <p>
                Connection status of services required
                by the issuer portal.
              </p>
            </div>
          </div>

          <div className="settings-connection-list">
            <ConnectionRow
              icon={Database}
              label="AU Student Database"
              description="Official student and academic records"
              status="Connected"
            />

            <ConnectionRow
              icon={WalletCards}
              label="Wallet Verification Service"
              description="Student wallet connection verification"
              status="Connected"
            />

            <ConnectionRow
              icon={ShieldCheck}
              label="Credential Issuer Service"
              description="Transcript credential issuance service"
              status="Connected"
            />
          </div>
        </section>

        {/* =====================================
            ISSUANCE PREFERENCES
        ===================================== */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon">
              <SlidersHorizontal size={19} />
            </div>

            <div>
              <h2>Issuance Preferences</h2>

              <p>
                Configure how transcript issuance
                behaves in the issuer portal.
              </p>
            </div>
          </div>

          <div className="settings-preference-list">
            <ToggleRow
              title="Confirm before single issuance"
              description="Show a confirmation before issuing an individual transcript."
              checked={confirmSingleIssue}
              onChange={setConfirmSingleIssue}
            />

            <ToggleRow
              title="Confirm before batch issuance"
              description="Require confirmation before issuing transcripts to a selected batch."
              checked={confirmBatchIssue}
              onChange={setConfirmBatchIssue}
            />

            <div className="settings-select-row">
              <div>
                <h3>
                  Default batch wallet filter
                </h3>

                <p>
                  Choose which wallet-status view
                  appears first in batch issuance.
                </p>
              </div>

              <select
                value={defaultWalletFilter}
                onChange={(event) =>
                  setDefaultWalletFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All
                </option>

                <option value="connected">
                  Connected
                </option>

                <option value="not-connected">
                  Not Connected
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* =====================================
            NOTIFICATIONS
        ===================================== */}

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon">
              <Bell size={19} />
            </div>

            <div>
              <h2>Notifications</h2>

              <p>
                Choose which operational
                notifications are shown in the
                portal.
              </p>
            </div>
          </div>

          <div className="settings-preference-list">
            <ToggleRow
              title="Automatic student verification"
              description="Show notifications when automatic verification results are available."
              checked={
                preferences.verification
              }
              onChange={(value) =>
                updatePreference(
                  "verification",
                  value
                )
              }
            />

            <ToggleRow
              title="Transcript issuance failure"
              description="Notify when a transcript could not be issued successfully."
              checked={
                preferences.issuanceFailure
              }
              onChange={(value) =>
                updatePreference(
                  "issuanceFailure",
                  value
                )
              }
            />

            <ToggleRow
              title="Batch issuance completed"
              description="Show a notification when a batch issuance operation finishes."
              checked={
                preferences.batchCompleted
              }
              onChange={(value) =>
                updatePreference(
                  "batchCompleted",
                  value
                )
              }
            />

            <ToggleRow
              title="System connection problems"
              description="Notify when a required issuer service becomes unavailable."
              checked={
                preferences.system
              }
              onChange={(value) =>
                updatePreference(
                  "system",
                  value
                )
              }
            />
          </div>
        </section>

        {/* =====================================
            ACCOUNT & SECURITY
        ===================================== */}

        <section className="settings-card settings-security-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2>Account & Security</h2>

              <p>
                Manage the current registrar session
                and account access.
              </p>
            </div>
          </div>

          <div className="settings-account-content">
            <div className="settings-account-profile">
              <div className="settings-account-avatar">
                AR
              </div>

              <div>
                <span>Signed in as</span>

                <h3>AU Registrar</h3>

                <p>Credential Issuer</p>
              </div>
            </div>

            <button
              type="button"
              className="settings-logout-button"
              onClick={() =>
                setShowLogoutModal(true)
              }
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </section>
      </div>

      {/* =====================================
          LOGOUT MODAL
      ===================================== */}

      {showLogoutModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={() =>
            setShowLogoutModal(false)
          }
        >
          <div
            className="settings-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="settings-modal-close"
              onClick={() =>
                setShowLogoutModal(false)
              }
              aria-label="Close logout confirmation"
            >
              <X size={17} />
            </button>

            <div className="settings-modal-icon">
              <LogOut size={20} />
            </div>

            <h2>Log out?</h2>

            <p>
              Are you sure you want to log out of
              the AU Wallet Issuer Portal?
            </p>

            <div className="settings-modal-actions">
              <button
                type="button"
                className="settings-cancel-button"
                onClick={() =>
                  setShowLogoutModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-confirm-logout"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================
   INFORMATION ROW
===================================== */

function SettingsInfoRow({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="settings-info-row">
      <span>{label}</span>

      <strong
        className={
          mono ? "settings-mono" : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}

/* =====================================
   CONNECTION ROW
===================================== */

function ConnectionRow({
  icon: Icon,
  label,
  description,
  status,
}) {
  return (
    <div className="settings-connection-row">
      <div className="settings-connection-info">
        <div className="settings-connection-icon">
          <Icon size={16} />
        </div>

        <div>
          <h3>{label}</h3>

          <p>{description}</p>
        </div>
      </div>

      <span className="settings-connected-status">
        <CheckCircle2 size={13} />
        {status}
      </span>
    </div>
  );
}

/* =====================================
   TOGGLE ROW
===================================== */

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="settings-toggle-row">
      <div>
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`settings-toggle ${
          checked
            ? "settings-toggle-active"
            : ""
        }`}
        onClick={() =>
          onChange(!checked)
        }
        aria-pressed={checked}
      >
        <span />
      </button>
    </div>
  );
}

export default Settings;