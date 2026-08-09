import {
  BarChart3,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  Users,
  Wallet,
} from "lucide-react";

import "./dashboard.css";

/*
  Frontend sample data only.

  Later, your backend developer can replace
  these values with real API data.
*/

const dashboardStats = {
  walletConnected: 1874,
  transcriptsIssued: 1328,
};

const recentWalletActivity = [
  {
    id: 1,
    studentId: "6611037",
    name: "Kaung Myat San",
    type: "wallet-created",
    time: "2 minutes ago",
  },
  {
    id: 2,
    studentId: "6611052",
    name: "Narin Wong",
    type: "verified",
    time: "8 minutes ago",
  },
  {
    id: 3,
    studentId: "6611088",
    name: "Mary Lee",
    type: "wallet-created",
    time: "14 minutes ago",
  },
  {
    id: 4,
    studentId: "6611104",
    name: "Ananda Chen",
    type: "verified",
    time: "21 minutes ago",
  },
  {
    id: 5,
    studentId: "6611120",
    name: "Pimchanok Arun",
    type: "wallet-created",
    time: "35 minutes ago",
  },
];

const transcriptAnalytics = [
  {
    graduationDate: "24 May 2026",
    issued: 391,
  },
  {
    graduationDate: "18 October 2026",
    issued: 301,
  },
  {
    graduationDate: "24 January 2027",
    issued: 244,
  },
  {
    graduationDate: "25 May 2027",
    issued: 178,
  },
];

function Dashboard({ onPageChange }) {
  const highestIssued = Math.max(
    ...transcriptAnalytics.map((item) => item.issued)
  );

  return (
    <div className="dashboard-page">
      {/* ===============================
          PAGE HEADING
      =============================== */}

      <div className="dashboard-page-heading">
        <div>
          <p className="dashboard-eyebrow">
            Registrar Workspace
          </p>

          <h1>Dashboard</h1>

          <p>
            Monitor wallet connections and transcript
            issuance activity.
          </p>
        </div>
      </div>

      {/* ===============================
          MAIN STATS
      =============================== */}

      <section className="dashboard-summary-grid">
        <DashboardStatCard
          icon={Wallet}
          label="Wallet Connected"
          value={dashboardStats.walletConnected}
          description="Students with connected holder wallets"
        />

        <DashboardStatCard
          icon={FileCheck2}
          label="Transcripts Issued"
          value={dashboardStats.transcriptsIssued}
          description="Transcript credentials successfully issued"
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
                Latest wallet connections and automatic
                student verification results.
              </p>
            </div>

            <Wallet size={20} />
          </div>

          <div className="wallet-activity-list">
            {recentWalletActivity.map((activity) => (
              <WalletActivityItem
                key={activity.id}
                activity={activity}
              />
            ))}
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

          <div className="transcript-analytics">
            {transcriptAnalytics.map((item) => {
              const percentage =
                (item.issued / highestIssued) * 100;

              return (
                <div
                  className="transcript-analytics-item"
                  key={item.graduationDate}
                >
                  <div className="analytics-item-heading">
                    <span>{item.graduationDate}</span>

                    <strong>
                      {item.issued.toLocaleString()}
                    </strong>
                  </div>

                  <div className="analytics-bar">
                    <div
                      className="analytics-bar-value"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <span className="analytics-item-caption">
                    Transcripts issued
                  </span>
                </div>
              );
            })}
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

          <h2>Issue Transcript</h2>

          <p>
            Start a single or batch transcript issuance.
          </p>
        </div>

        <div className="dashboard-action-buttons">
          <button
            type="button"
            className="dashboard-secondary-action"
            onClick={() =>
              onPageChange?.("issue-transcript","single")
            }
          >
            <FilePlus2 size={17} />
            Single Issuance
          </button>

          <button
            type="button"
            className="dashboard-primary-action"
            onClick={() =>
              onPageChange?.("issue-transcript","batch")
            }
          >
            <Users size={17} />
            Batch Issuance
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
}) {
  return (
    <div className="dashboard-stat-card">
      <div>
        <span className="dashboard-stat-label">
          {label}
        </span>

        <strong>
          {value.toLocaleString()}
        </strong>

        <p>{description}</p>
      </div>

      <div className="dashboard-stat-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}

function WalletActivityItem({ activity }) {
  const isWalletCreated =
    activity.type === "wallet-created";

  return (
    <div className="wallet-activity-item">
      <div
        className={`wallet-activity-icon ${
          isWalletCreated
            ? "wallet-activity-created"
            : "wallet-activity-verified"
        }`}
      >
        {isWalletCreated ? (
          <Wallet size={16} />
        ) : (
          <CheckCircle2 size={16} />
        )}
      </div>

      <div className="wallet-activity-content">
        <div>
          <strong>
            {activity.name}
          </strong>

          <span>
            {activity.studentId}
          </span>
        </div>

        <p>
          {isWalletCreated
            ? "Created and connected a holder wallet."
            : "Student identity automatically verified."}
        </p>
      </div>

      <span className="wallet-activity-time">
        {activity.time}
      </span>
    </div>
  );
}

export default Dashboard;