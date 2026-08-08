import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  LoaderCircle,
  Send,
  Users,
  XCircle,
} from "lucide-react";

import "./batch-transcript.css";

const MOCK_STUDENTS = [
  {
    id: "6412345",
    name: "John Smith",
    program: "B.Sc. Computer Science",
    graduationDate: "2026-05-24",
    gpa: "3.75",
    walletDid: "did:key:z6MkJohnWallet",
    status: "ready",
  },
  {
    id: "6412346",
    name: "Mary Lee",
    program: "B.B.A. Business Administration",
    graduationDate: "2026-05-24",
    gpa: "3.62",
    walletDid: "did:key:z6MkMaryWallet",
    status: "ready",
  },
  {
    id: "6412347",
    name: "Ananda Chen",
    program: "B.Sc. Information Technology",
    graduationDate: "2026-05-24",
    gpa: "3.81",
    walletDid: "did:key:z6MkAnandaWallet",
    status: "ready",
  },
  {
    id: "6412348",
    name: "Narin Wong",
    program: "B.Sc. Computer Science",
    graduationDate: "2026-05-24",
    gpa: "3.45",
    walletDid: "",
    status: "missing-wallet",
  },
  {
    id: "6512301",
    name: "Sofia Tan",
    program: "B.Sc. Computer Science",
    graduationDate: "2026-10-18",
    gpa: "3.70",
    walletDid: "did:key:z6MkSofiaWallet",
    status: "ready",
  },
];

function BatchTranscript() {
  const [graduationDate, setGraduationDate] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [results, setResults] = useState({});
  const [error, setError] = useState("");

  const eligibleStudents = useMemo(
    () => students.filter((student) => student.status === "ready"),
    [students]
  );

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.includes(student.id)),
    [students, selectedIds]
  );

  const allEligibleSelected =
    eligibleStudents.length > 0 &&
    eligibleStudents.every((student) => selectedIds.includes(student.id));

  const handleFindStudents = (event) => {
    event.preventDefault();

    if (!graduationDate) {
      setError("Please select a graduation date.");
      return;
    }

    const matches = MOCK_STUDENTS.filter(
      (student) => student.graduationDate === graduationDate
    );

    setStudents(matches);
    setSelectedIds(
      matches
        .filter((student) => student.status === "ready")
        .map((student) => student.id)
    );

    setResults({});
    setError("");
    setSearchPerformed(true);
  };

  const handleSelectAll = () => {
    if (allEligibleSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(
      eligibleStudents.map((student) => student.id)
    );
  };

  const handleStudentToggle = (student) => {
    if (student.status !== "ready" || isIssuing) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(student.id)
        ? current.filter((id) => id !== student.id)
        : [...current, student.id]
    );
  };

  const issueOneTranscript = async (student) => {
    /*
      Replace this later with your backend API:

      const response = await fetch("/api/transcripts/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          holderDid: student.walletDid,
        }),
      });

      if (!response.ok) {
        throw new Error("Issuance failed");
      }
    */

    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      studentId: student.id,
      success: true,
    };
  };

  const handleBatchIssue = async () => {
    if (selectedStudents.length === 0) {
      setError("Select at least one student.");
      return;
    }

    setError("");
    setIsIssuing(true);
    setResults({});

    for (const student of selectedStudents) {
      setResults((current) => ({
        ...current,
        [student.id]: {
          status: "processing",
        },
      }));

      try {
        await issueOneTranscript(student);

        setResults((current) => ({
          ...current,
          [student.id]: {
            status: "success",
          },
        }));
      } catch (issueError) {
        console.error(
          `Transcript issuance failed for ${student.id}`,
          issueError
        );

        setResults((current) => ({
          ...current,
          [student.id]: {
            status: "failed",
          },
        }));
      }
    }

    setIsIssuing(false);
  };

  const successCount = Object.values(results).filter(
    (result) => result.status === "success"
  ).length;

  const failedCount = Object.values(results).filter(
    (result) => result.status === "failed"
  ).length;

  return (
    <div className="batch-page">
      <div className="batch-page-heading">
        <div>
          <p className="batch-eyebrow">Transcript Issuance</p>

          <h1>Batch Issue Transcripts</h1>

          <p>
            Find graduating students by graduation date, review their
            eligibility, then generate and send their official AU Transcript
            Verifiable Credentials.
          </p>
        </div>
      </div>

      <section className="batch-card">
        <div className="batch-card-heading">
          <div className="batch-heading-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2>Select Graduation Date</h2>
            <p>
              Students graduating on the selected date will be loaded from the
              AU student database.
            </p>
          </div>
        </div>

        <form className="batch-date-form" onSubmit={handleFindStudents}>
          <div className="batch-form-field">
            <label htmlFor="graduation-date">
              Graduation Date
            </label>

            <input
              id="graduation-date"
              type="date"
              value={graduationDate}
              onChange={(event) =>
                setGraduationDate(event.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="batch-primary-button"
          >
            <Users size={17} />
            Find Graduating Students
          </button>
        </form>

        {error && (
          <p className="batch-error">{error}</p>
        )}

        <p className="batch-demo-hint">
          Demo date: <strong>24 May 2026</strong>
        </p>
      </section>

      {searchPerformed && students.length === 0 && (
        <section className="batch-empty-state">
          <Users size={32} />

          <h2>No graduating students found</h2>

          <p>
            There are no student records for the selected graduation date.
          </p>
        </section>
      )}

      {students.length > 0 && (
        <>
          <section className="batch-summary-grid">
            <SummaryCard
              icon={Users}
              value={students.length}
              label="Graduating Students"
            />

            <SummaryCard
              icon={FileCheck2}
              value={eligibleStudents.length}
              label="Ready to Issue"
            />

            <SummaryCard
              icon={CheckCircle2}
              value={successCount}
              label="Successfully Sent"
            />

            <SummaryCard
              icon={XCircle}
              value={failedCount}
              label="Failed"
            />
          </section>

          <section className="batch-card batch-students-card">
            <div className="batch-list-heading">
              <div>
                <h2>Graduating Students</h2>

                <p>
                  {students.length} student
                  {students.length !== 1 ? "s" : ""} found for{" "}
                  <strong>{formatDate(graduationDate)}</strong>.
                </p>
              </div>

              <button
                type="button"
                className="batch-secondary-button"
                onClick={handleSelectAll}
                disabled={isIssuing}
              >
                {allEligibleSelected
                  ? "Clear Selection"
                  : "Select All Ready"}
              </button>
            </div>

            <div className="batch-table-wrapper">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th className="batch-checkbox-column">
                      Select
                    </th>
                    <th>Student ID</th>
                    <th>Student</th>
                    <th>Program</th>
                    <th>GPA</th>
                    <th>Wallet</th>
                    <th>Status</th>
                    <th>Issuance</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => {
                    const selected = selectedIds.includes(
                      student.id
                    );

                    const result = results[student.id];

                    return (
                      <tr key={student.id}>
                        <td className="batch-checkbox-column">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={
                              student.status !== "ready" ||
                              isIssuing
                            }
                            onChange={() =>
                              handleStudentToggle(student)
                            }
                          />
                        </td>

                        <td className="batch-student-id">
                          {student.id}
                        </td>

                        <td>
                          <strong>{student.name}</strong>
                        </td>

                        <td>{student.program}</td>

                        <td>{student.gpa}</td>

                        <td>
                          {student.walletDid ? (
                            <span className="batch-wallet-ready">
                              Connected
                            </span>
                          ) : (
                            <span className="batch-wallet-missing">
                              Missing
                            </span>
                          )}
                        </td>

                        <td>
                          {student.status === "ready" ? (
                            <span className="batch-status batch-status-ready">
                              Ready
                            </span>
                          ) : (
                            <span className="batch-status batch-status-warning">
                              Cannot issue
                            </span>
                          )}
                        </td>

                        <td>
                          <IssuanceResult result={result} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="batch-action-footer">
              <div>
                <strong>
                  {selectedStudents.length}
                </strong>{" "}
                student
                {selectedStudents.length !== 1 ? "s" : ""} selected
              </div>

              <button
                type="button"
                className="batch-issue-button"
                disabled={
                  selectedStudents.length === 0 ||
                  isIssuing
                }
                onClick={handleBatchIssue}
              >
                {isIssuing ? (
                  <>
                    <LoaderCircle
                      className="batch-spinner"
                      size={17}
                    />
                    Issuing Transcripts...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Issue Selected Transcripts
                  </>
                )}
              </button>
            </div>
          </section>

          {successCount > 0 &&
            !isIssuing &&
            successCount === selectedStudents.length && (
              <section className="batch-success-message">
                <CheckCircle2 size={23} />

                <div>
                  <h3>Batch issuance completed</h3>

                  <p>
                    {successCount} transcript credential
                    {successCount !== 1 ? "s were" : " was"} generated,
                    signed, and sent to the students' wallets.
                  </p>
                </div>
              </section>
            )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, value, label }) {
  return (
    <div className="batch-summary-card">
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>

      <div className="batch-summary-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}

function IssuanceResult({ result }) {
  if (!result) {
    return <span className="batch-result-idle">—</span>;
  }

  if (result.status === "processing") {
    return (
      <span className="batch-result-processing">
        <LoaderCircle
          size={14}
          className="batch-spinner"
        />
        Processing
      </span>
    );
  }

  if (result.status === "success") {
    return (
      <span className="batch-result-success">
        <CheckCircle2 size={14} />
        Sent
      </span>
    );
  }

  return (
    <span className="batch-result-failed">
      <XCircle size={14} />
      Failed
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default BatchTranscript;