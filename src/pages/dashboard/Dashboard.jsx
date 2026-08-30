import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  Users,
  Wallet,
} from "lucide-react";

import { getIssuerConnectionSummary } from "../../api/issuerApi";
import "./dashboard.css";

function Dashboard({ onPageChange }) {
  const [verifiedConnectionCount, setVerifiedConnectionCount] =
    useState(null);

  const [recentVerifications, setRecentVerifications] =
    useState([]);

  const [connectionSummaryStatus, setConnectionSummaryStatus] =
    useState("loading");

  useEffect(() => {
    const abortController = new AbortController();

    async function loadConnectionSummary() {
      try {
        const connectionSummary =
          await getIssuerConnectionSummary({
            signal: abortController.signal,
          });

        setVerifiedConnectionCount(
          connectionSummary.verifiedConnectionCount,
        );

        setRecentVerifications(
          connectionSummary.recentVerifications,
        );

        setConnectionSummaryStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            "Unable to load issuer connection summary.",
            error,
          );

          setConnectionSummaryStatus("error");
        }
      }
    }

    loadConnectionSummary();

    return () => abortController.abort();
  }, []);

  const walletConnectedValue =
    connectionSummaryStatus === "success"
      ? verifiedConnectionCount
      : connectionSummaryStatus === "error"
        ? "Unavailable"
        : "Loading…";

  return (
    <div className="dashboard-page">

      {/* ===============================
          MAIN STATS
      =============================== */}

      <section className="dashboard-summary-grid">
        <DashboardStatCard
          icon={Wallet}
          label="Wallet Connected"
          value={walletConnectedValue}
          description="Students with connected holder wallets"
        />

        <DashboardStatCard
          icon={FileCheck2}
          label="Transcripts Issued"
          value="Not available"
          description="View all issued transcript credentials"
          onClick={() =>
            onPageChange?.("issued-credentials")
          }
        />
      </section>

      {/* ===============================
          MAIN CONTENT
      =============================== */}

      <div className="dashboard-content-grid">

        {/* Recent wallet activity */}

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Recent Wallet Activity</h2>

              <p>
                Latest automatic student verification
                results.
              </p>
            </div>

            <Wallet size={20} />
          </div>

          <div className="wallet-activity-list">
            {connectionSummaryStatus === "loading" && (
              <WalletActivityState
                message="Loading recent verifications…"
              />
            )}

            {connectionSummaryStatus === "error" && (
              <WalletActivityState
                message="Recent verifications could not be loaded."
                isError
              />
            )}

            {connectionSummaryStatus === "success" &&
              recentVerifications.length === 0 && (
                <WalletActivityState
                  message="No recent verifications."
                />
              )}

            {connectionSummaryStatus === "success" &&
              recentVerifications.map(
                (verification) => (
                  <WalletActivityItem
                    key={`${verification.programCode}-${verification.verifiedAt}`}
                    verification={verification}
                  />
                ),
              )}
          </div>
        </section>

        {/* Transcript analytics */}

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                Transcript Issuance by Graduation Date
              </h2>

              <p>
                Number of transcript credentials issued
                for each graduation group.
              </p>
            </div>

            <BarChart3 size={20} />
          </div>

          <div className="dashboard-issuance-unavailable">
            <FileCheck2 size={22} />

            <div>
              <strong>
                Credential issuance analytics unavailable
              </strong>

              <p>
                Transcript totals and analytics will appear
                when supported issuer backend endpoints are
                available.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ===============================
          QUICK ACTIONS
      =============================== */}

      <section className="dashboard-quick-actions">
        <div>
          <p className="dashboard-section-label">
            Quick Actions
          </p>

          <h2>Transcript Issuance</h2>

          <p id="transcript-actions-unavailable">
            Prepare a single or batch selection for a future
            issuance service.
          </p>
        </div>

        <div className="dashboard-action-buttons">
          <button
            type="button"
            className="dashboard-secondary-action"
            onClick={() =>
              onPageChange?.(
                "issue-transcript",
                "single",
              )
            }
          >
            <FilePlus2 size={17} />
            Single Preparation
          </button>

          <button
            type="button"
            className="dashboard-primary-action"
            onClick={() =>
              onPageChange?.(
                "issue-transcript",
                "batch",
              )
            }
          >
            <Users size={17} />
            Batch Preparation
          </button>
        </div>
      </section>
    </div>
  );
}

function DashboardStatCard({
  icon: Icon,
  label,
  value,
  description,
  onClick,
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`dashboard-stat-card ${
        isClickable
          ? "dashboard-stat-card-clickable"
          : ""
      }`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(event) => {
        if (
          isClickable &&
          (event.key === "Enter" ||
            event.key === " ")
        ) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div>
        <span className="dashboard-stat-label">
          {label}
        </span>

        <strong>
          {typeof value === "number"
            ? value.toLocaleString()
            : value}
        </strong>

        <p>{description}</p>
      </div>

      <div className="dashboard-stat-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}

function WalletActivityItem({ verification }) {
  return (
    <div className="wallet-activity-item">
      <div className="wallet-activity-icon wallet-activity-verified">
        <CheckCircle2 size={16} />
      </div>

      <div className="wallet-activity-content">
        <div>
          <strong>{verification.major}</strong>

          <span>
            Verified wallet connection
          </span>
        </div>
      </div>

      <time
        className="wallet-activity-time"
        dateTime={verification.verifiedAt}
      >
        {formatVerifiedAt(
          verification.verifiedAt,
        )}
      </time>
    </div>
  );
}

function WalletActivityState({
  message,
  isError = false,
}) {
  return (
    <div
      className="wallet-activity-item"
      role={isError ? "alert" : "status"}
    >
      <div className="wallet-activity-icon">
        <Wallet size={16} />
      </div>

      <div className="wallet-activity-content">
        <p>{message}</p>
      </div>
    </div>
  );
}

function formatVerifiedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default Dashboard;