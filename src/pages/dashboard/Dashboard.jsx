import { useEffect, useId, useState } from "react";
import {
  ChartNoAxesCombined,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  Users,
  Wallet,
} from "lucide-react";

import {
  getIssuedCredentials,
  getIssuerConnectionSummary,
  getStudentAcademicReview,
} from "../../api/issuerApi";
import { buildIssuedStudentSeries, getIssuanceEndYear } from "../../api/issuanceAnalytics";
import "./dashboard.css";

function Dashboard({ onPageChange }) {
  const [verifiedConnectionCount, setVerifiedConnectionCount] = useState(null);

  const [recentVerifications, setRecentVerifications] = useState([]);

  const [connectionSummaryStatus, setConnectionSummaryStatus] =
    useState("loading");

  const [issuedCredentialCount, setIssuedCredentialCount] = useState(null);

  const [issuedCredentialCountStatus, setIssuedCredentialCountStatus] =
    useState("loading");

  const [graduationBreakdown, setGraduationBreakdown] = useState([]);

  const [graduationBreakdownStatus, setGraduationBreakdownStatus] =
    useState("loading");

  const [endYear, setEndYear] = useState(() => getIssuanceEndYear());

  useEffect(() => {
    const updateYear = () => setEndYear(getIssuanceEndYear());
    const timer = window.setInterval(updateYear, 1000);
    window.addEventListener("focus", updateYear);
    document.addEventListener("visibilitychange", updateYear);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateYear);
      document.removeEventListener("visibilitychange", updateYear);
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadConnectionSummary() {
      try {
        const connectionSummary = await getIssuerConnectionSummary({
          signal: abortController.signal,
        });

        setVerifiedConnectionCount(connectionSummary.verifiedConnectionCount);

        setRecentVerifications(connectionSummary.recentVerifications);

        setConnectionSummaryStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load issuer connection summary.", error);

          setConnectionSummaryStatus("error");
        }
      }
    }

    async function loadIssuedCredentialCount() {
      try {
        const issuedCredentials = await getIssuedCredentials({
          page: 1,
          pageSize: 1,
          signal: abortController.signal,
        });

        if (!Number.isInteger(issuedCredentials.meta?.total)) {
          throw new Error("Issued credential count is unavailable.");
        }

        setIssuedCredentialCount(issuedCredentials.meta.total);
        setIssuedCredentialCountStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load issued credential count.", error);

          setIssuedCredentialCountStatus("error");
        }
      }
    }

    async function loadGraduationBreakdown() {
      try {
        const records = await fetchAllIssuedCredentials({
          signal: abortController.signal,
        });

        const students = [];
        const studentNumbers = [
          ...new Set(records.map((record) => record.studentNumber)),
        ];
        // Bound concurrent academic-review requests and fetch each student once.
        for (let index = 0; index < studentNumbers.length; index += 8) {
          const reviews = await Promise.all(
            studentNumbers.slice(index, index + 8).map((studentNumber) =>
              getStudentAcademicReview(studentNumber, {
                signal: abortController.signal,
              }),
            ),
          );
          students.push(...reviews);
        }
        setGraduationBreakdown(buildIssuedStudentSeries(records, students, endYear));
        setGraduationBreakdownStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load transcript issuance breakdown.", error);

          setGraduationBreakdownStatus("error");
        }
      }
    }

    loadConnectionSummary();
    loadIssuedCredentialCount();
    loadGraduationBreakdown();

    return () => abortController.abort();
  }, [endYear]);

  const walletConnectedValue =
    connectionSummaryStatus === "success"
      ? verifiedConnectionCount
      : connectionSummaryStatus === "error"
        ? "Unavailable"
        : "Loading…";

  const issuedCredentialsValue =
    issuedCredentialCountStatus === "success"
      ? issuedCredentialCount
      : issuedCredentialCountStatus === "error"
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
          value={issuedCredentialsValue}
          description="View all issued transcript credentials"
          onClick={() => onPageChange?.("issued-credentials")}
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

              <p>Latest automatic student verification results.</p>
            </div>

            <Wallet size={20} />
          </div>

          <div className="wallet-activity-list">
            {connectionSummaryStatus === "loading" && (
              <WalletActivityState message="Loading recent verifications…" />
            )}

            {connectionSummaryStatus === "error" && (
              <WalletActivityState
                message="Recent verifications could not be loaded."
                isError
              />
            )}

            {connectionSummaryStatus === "success" &&
              recentVerifications.length === 0 && (
                <WalletActivityState message="No recent verifications." />
              )}

            {connectionSummaryStatus === "success" &&
              recentVerifications.map((verification) => (
                <WalletActivityItem
                  key={`${verification.programCode}-${verification.verifiedAt}`}
                  verification={verification}
                />
              ))}
          </div>
        </section>

        {/* Transcript analytics */}

        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Issued Students by Graduation Year</h2>

              <p>
                Students with issued transcripts, grouped by graduation year ·
                2020–{endYear}.
              </p>
            </div>

            <ChartNoAxesCombined size={20} />
          </div>

          {graduationBreakdownStatus === "loading" && (
            <WalletActivityState message="Loading issuance breakdown…" />
          )}

          {graduationBreakdownStatus === "error" && (
            <WalletActivityState
              message="Issuance breakdown could not be loaded."
              isError
            />
          )}

          {graduationBreakdownStatus === "success" &&
            graduationBreakdown.length === 0 && (
              <WalletActivityState message="No issued transcripts yet." />
            )}

          {graduationBreakdownStatus === "success" &&
            graduationBreakdown.length > 0 && (
              <IssuanceByGraduationChart data={graduationBreakdown} endYear={endYear} />
            )}
        </section>
      </div>

      {/* ===============================
          QUICK ACTIONS
      =============================== */}

      <section className="dashboard-quick-actions">
        <div>
          <p className="dashboard-section-label">Quick Actions</p>

          <h2>Transcript Issuance</h2>

          <p id="transcript-actions-unavailable">
            Prepare a single or batch selection for a future issuance service.
          </p>
        </div>

        <div className="dashboard-action-buttons">
          <button
            type="button"
            className="dashboard-secondary-action"
            onClick={() => onPageChange?.("issue-transcript", "single")}
          >
            <FilePlus2 size={17} />
            Single Preparation
          </button>

          <button
            type="button"
            className="dashboard-primary-action"
            onClick={() => onPageChange?.("issue-transcript", "batch")}
          >
            <Users size={17} />
            Batch Preparation
          </button>
        </div>
      </section>
    </div>
  );
}

function DashboardStatCard({ icon: Icon, label, value, description, onClick }) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`dashboard-stat-card ${
        isClickable ? "dashboard-stat-card-clickable" : ""
      }`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(event) => {
        if (isClickable && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div>
        <span className="dashboard-stat-label">{label}</span>

        <strong>
          {typeof value === "number" ? value.toLocaleString() : value}
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

          <span>Verified wallet connection</span>
        </div>
      </div>

      <time className="wallet-activity-time" dateTime={verification.verifiedAt}>
        {formatVerifiedAt(verification.verifiedAt)}
      </time>
    </div>
  );
}

function WalletActivityState({ message, isError = false }) {
  return (
    <div className="wallet-activity-item" role={isError ? "alert" : "status"}>
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

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// issuerApi.js caps pageSize at 100 (MAX_PAGE_SIZE), so the full issued
// list has to be paginated rather than pulled in one request.
const ISSUANCE_BREAKDOWN_PAGE_SIZE = 100;

// Safety cap on how many pages this will walk (100 * 50 = 5,000 credentials)
// so a bad `meta.total` value can't spin this into an infinite loop. Raise
// this if the issuer genuinely has more transcripts on file than that.
const ISSUANCE_BREAKDOWN_MAX_PAGES = 50;

async function fetchAllIssuedCredentials({ signal }) {
  const records = [];
  let page = 1;
  let total = null;

  while (page <= ISSUANCE_BREAKDOWN_MAX_PAGES) {
    const result = await getIssuedCredentials({
      page,
      pageSize: ISSUANCE_BREAKDOWN_PAGE_SIZE,
      signal,
    });

    records.push(...result.credentials);

    if (Number.isInteger(result.meta?.total)) {
      total = result.meta.total;
    }

    const receivedFullPage =
      result.credentials.length === ISSUANCE_BREAKDOWN_PAGE_SIZE;
    const knownTotalReached = total !== null && records.length >= total;

    if (knownTotalReached || !receivedFullPage) {
      break;
    }

    page += 1;
  }

  if (total !== null && records.length < total) {
    throw new Error(
      "Incomplete issued credential data; unable to calculate accurate totals.",
    );
  }
  return records;
}

function IssuanceByGraduationChart({ data, endYear }) {
  const gradientId = useId();
  const [activeKey, setActiveKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const selected = data.find((group) => group.key === selectedKey);
  const detailsId = `${gradientId}-students`;
  const dated = data.filter(
    (group) => group.key !== "unknown" && !group.outsideRange,
  );
  const outside = data.filter((group) => group.outsideRange);
  const inRangeTotal = dated.reduce((sum, group) => sum + group.count, 0);
  const unknown = data.find((group) => group.key === "unknown")?.count ?? 0;
  const total = data.reduce((sum, group) => sum + group.count, 0);
  const ceiling = Math.max(
    4,
    Math.ceil(Math.max(...dated.map((group) => group.count), 0) / 4) * 4,
  );
  const width = Math.max(560, dated.length * 85);
  const left = 42;
  const right = width - 30;
  const top = 24;
  const bottom = 204;
  const points = dated.map((group, index) => ({
    ...group,
    x:
      dated.length === 1
        ? (left + right) / 2
        : left + (index * (right - left)) / (dated.length - 1),
    y: bottom - (group.count / ceiling) * (bottom - top),
  }));
  const active =
    points.find((point) => point.key === activeKey) ?? points.at(-1);
  const line = points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="issuance-chart">
      <div className="issuance-chart-summary">
        <div>
          <span className="issuance-chart-eyebrow">
            Total issued students · all years
          </span>
          <strong>{total.toLocaleString()}</strong>
        </div>
        <span className="issuance-chart-order">2020–{endYear} ↑</span>
      </div>
      <p className="issuance-chart-scope">
        {inRangeTotal.toLocaleString()} of {total.toLocaleString()} issued
        students graduated in 2020–{endYear}.
      </p>
      {points.length > 0 ? (
        <>
          <div className="issuance-chart-selection" aria-live="polite">
            <span className="issuance-chart-dot" />
            <span>{active.label}</span>
            <strong>{active.count.toLocaleString()} issued</strong>
          </div>
          <div
            className="issuance-chart-scroll"
            onMouseLeave={() => setActiveKey(null)}
          >
            {activeKey && (
              <div className="issuance-chart-tooltip" role="tooltip">
                <strong>
                  {active.label} · {active.count} issued{" "}
                  {active.count === 1 ? "student" : "students"}
                </strong>
                {active.students.slice(0, 3).map((student) => (
                  <span key={student.studentNumber}>
                    {student.fullName || "Name unavailable"} ·{" "}
                    {student.studentNumber}
                  </span>
                ))}
                <small>
                  {active.count > 3 ? `+${active.count - 3} more · ` : ""}
                  {active.count
                    ? "Click to view student and credential details"
                    : "No issued students in this year"}
                </small>
              </div>
            )}
            <svg
              className="issuance-chart-svg"
              viewBox={`0 0 ${width} 264`}
              role="group"
              aria-label={`Issued students by graduation year, 2020 to ${endYear}`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cc1919" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#cc1919" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((tick) => {
                const y = bottom - (tick * (bottom - top)) / 4;
                return (
                  <g key={tick}>
                    <line
                      x1={left}
                      x2={right}
                      y1={y}
                      y2={y}
                      stroke="#eee7e3"
                      strokeDasharray="4 5"
                    />
                    <text x={left - 12} y={y + 4} textAnchor="end">
                      {(ceiling * tick) / 4}
                    </text>
                  </g>
                );
              })}
              {points.length > 1 && (
                <path
                  d={`${line} L ${points.at(-1).x} ${bottom} L ${points[0].x} ${bottom} Z`}
                  fill={`url(#${gradientId})`}
                />
              )}
              <path
                d={line}
                fill="none"
                stroke="#cc1919"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map((point) => (
                <g key={point.key}>
                  {active.key === point.key && (
                    <line
                      x1={point.x}
                      x2={point.x}
                      y1={top}
                      y2={bottom}
                      stroke="#cc1919"
                      strokeOpacity="0.22"
                      strokeDasharray="4 4"
                    />
                  )}
                  <g
                    className="issuance-chart-point"
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${point.count} issued students graduating in ${point.label}`}
                    aria-expanded={selectedKey === point.key}
                    aria-controls={detailsId}
                    onMouseEnter={() => setActiveKey(point.key)}
                    onFocus={() => setActiveKey(point.key)}
                    onBlur={() => setActiveKey(null)}
                    onClick={() => setSelectedKey(point.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedKey(point.key);
                      }
                      if (event.key === "Escape") setActiveKey(null);
                    }}
                  >
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="18"
                      fill="transparent"
                    />
                    <circle
                      className="issuance-chart-marker"
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill={selectedKey === point.key ? "#cc1919" : "white"}
                      stroke="#cc1919"
                      strokeWidth="3"
                    />
                  </g>
                  <text
                    x={point.x}
                    y="229"
                    textAnchor={
                      points.length === 1
                        ? "middle"
                        : point === points[0]
                          ? "start"
                          : point === points.at(-1)
                            ? "end"
                            : "middle"
                    }
                  >
                    {point.label}
                  </text>
                </g>
              ))}
              <text x={(left + right) / 2} y="256" textAnchor="middle">
                Graduation year · oldest to newest
              </text>
            </svg>
          </div>
          <div className="issuance-chart-footer">
            <span>
              <i className="issuance-chart-dot" /> Issued students
            </span>
            <span>
              {dated.length} graduation{" "}
              {dated.length === 1 ? "group" : "groups"}
            </span>
          </div>
        </>
      ) : (
        <div className="issuance-chart-empty">
          <ChartNoAxesCombined size={32} />
          <strong>Graduation dates unavailable</strong>
          <p>
            Issued transcripts will appear here when graduation dates are
            available.
          </p>
        </div>
      )}
      {outside.length > 0 && (
        <p className="issuance-chart-note">
          Outside the chart’s 2020–{endYear} range:{" "}
          {outside
            .map(
              (group) =>
                `${group.label}: ${group.count} ${group.count === 1 ? "student" : "students"}`,
            )
            .join(" · ")}
          . Included in the total above.
        </p>
      )}
      {outside.map((group) => (
        <button
          key={group.key}
          type="button"
          className="issuance-students-link"
          onClick={() => setSelectedKey(group.key)}
          aria-controls={detailsId}
          aria-expanded={selectedKey === group.key}
        >
          View {group.label} students ({group.count})
        </button>
      ))}
      {unknown > 0 && (
        <button
          type="button"
          className="issuance-students-link"
          onClick={() => setSelectedKey("unknown")}
          aria-controls={detailsId}
        >
          View students with unavailable dates ({unknown})
        </button>
      )}
      {selected && (
        <section
          id={detailsId}
          className="issuance-student-details"
          aria-label={`Issued students: ${selected.label}`}
        >
          <div className="issuance-details-heading">
            <h3>
              {selected.label} · {selected.count} issued{" "}
              {selected.count === 1 ? "student" : "students"}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              aria-label="Close student details"
            >
              Close
            </button>
          </div>
          {selected.students.length === 0 && (
            <p>No issued students graduated in this year.</p>
          )}
          {selected.students.map((student) => (
            <article
              key={student.studentNumber}
              className="issuance-student-record"
            >
              <strong>{student.fullName || "Name unavailable"}</strong>
              <dl>
                <div>
                  <dt>Student ID</dt>
                  <dd>{student.studentNumber}</dd>
                </div>
                <div>
                  <dt>Major</dt>
                  <dd>
                    {student.major ||
                      student.credentials[0]?.major ||
                      "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt>Graduation date</dt>
                  <dd>{student.graduationDate || "Not recorded"}</dd>
                </div>
              </dl>
              {student.credentials.map((credential, index) => (
                <div
                  className="issuance-credential-record"
                  key={credential.credentialId || index}
                >
                  <span>Credential ID</span>
                  <strong>{credential.credentialId || "Not recorded"}</strong>
                  <span>Issued at</span>
                  <strong>
                    {credential.issuedAt
                      ? formatVerifiedAt(credential.issuedAt)
                      : "Not recorded"}
                  </strong>
                  <span>Status</span>
                  <strong>{credential.status || "Not recorded"}</strong>
                </div>
              ))}
            </article>
          ))}
        </section>
      )}
      {unknown > 0 && (
        <p className="issuance-chart-note">
          {unknown.toLocaleString()}{" "}
          {unknown === 1
            ? "student’s graduation date is"
            : "students’ graduation dates are"}{" "}
          unavailable in academic records.
        </p>
      )}
    </div>
  );
}

export default Dashboard;
