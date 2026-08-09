import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Send,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import "./batch-transcript.css";

const FACULTIES = [
  {
    name: "Vincent Mary School of Science and Technology",
    majors: [
      "Computer Science",
      "Information Technology",
      "Computer Engineering",
    ],
  },
  {
    name: "Martin de Tours School of Management and Economics",
    majors: ["Business Administration", "Marketing", "Finance"],
  },
  {
    name: "Albert Laurence School of Communication Arts",
    majors: ["Advertising", "Digital Media Communication", "Public Relations"],
  },
];

const MOCK_STUDENTS = [
  {
    id: "6412345",
    name: "John Smith",
    faculty: "Vincent Mary School of Science and Technology",
    major: "Computer Science",
    graduationDate: "2026-05-24",
    cgpa: "3.75",
    walletDid: "did:key:z6MkJohnWallet",
    walletConnected: true,
  },
  {
    id: "6412346",
    name: "Mary Lee",
    faculty: "Vincent Mary School of Science and Technology",
    major: "Computer Science",
    graduationDate: "2026-05-24",
    cgpa: "3.62",
    walletDid: "",
    walletConnected: false,
  },
  {
    id: "6412347",
    name: "Ananda Chen",
    faculty: "Vincent Mary School of Science and Technology",
    major: "Information Technology",
    graduationDate: "2026-05-24",
    cgpa: "3.81",
    walletDid: "did:key:z6MkAnandaWallet",
    walletConnected: true,
  },
  {
    id: "6412348",
    name: "Narin Wong",
    faculty: "Vincent Mary School of Science and Technology",
    major: "Computer Science",
    graduationDate: "2026-05-24",
    cgpa: "3.45",
    walletDid: "did:key:z6MkNarinWallet",
    walletConnected: true,
  },
  {
    id: "6412350",
    name: "Pimchanok Arun",
    faculty: "Martin de Tours School of Management and Economics",
    major: "Business Administration",
    graduationDate: "2026-05-24",
    cgpa: "3.56",
    walletDid: "did:key:z6MkPimWallet",
    walletConnected: true,
  },
  {
    id: "6412351",
    name: "Thana Kittisak",
    faculty: "Martin de Tours School of Management and Economics",
    major: "Finance",
    graduationDate: "2026-05-24",
    cgpa: "3.41",
    walletDid: "",
    walletConnected: false,
  },
  {
    id: "6512301",
    name: "Sofia Tan",
    faculty: "Vincent Mary School of Science and Technology",
    major: "Computer Science",
    graduationDate: "2026-10-18",
    cgpa: "3.70",
    walletDid: "did:key:z6MkSofiaWallet",
    walletConnected: true,
  },
];

function BatchTranscript() {
  const [graduationDate, setGraduationDate] = useState("");
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [walletFilter, setWalletFilter] = useState("all");

  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const [results, setResults] = useState({});
  const [error, setError] = useState("");

  const selectedFaculty = FACULTIES.find((item) => item.name === faculty);

  const availableMajors = selectedFaculty ? selectedFaculty.majors : [];

  const connectedStudents = useMemo(
    () => students.filter((student) => student.walletConnected),
    [students],
  );

  const notConnectedStudents = useMemo(
    () => students.filter((student) => !student.walletConnected),
    [students],
  );

  const filteredStudents = useMemo(() => {
    if (walletFilter === "connected") {
      return students.filter((student) => student.walletConnected);
    }

    if (walletFilter === "not-connected") {
      return students.filter((student) => !student.walletConnected);
    }

    return students;
  }, [students, walletFilter]);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.includes(student.id)),
    [students, selectedIds],
  );

  const visibleConnectedStudents = useMemo(
    () => filteredStudents.filter((student) => student.walletConnected),
    [filteredStudents],
  );

  const allVisibleConnectedSelected =
    visibleConnectedStudents.length > 0 &&
    visibleConnectedStudents.every((student) =>
      selectedIds.includes(student.id),
    );

  const handleFacultyChange = (event) => {
    setFaculty(event.target.value);
    setMajor("");

    clearSearchResults();
  };

  const handleMajorChange = (event) => {
    setMajor(event.target.value);

    clearSearchResults();
  };

  const handleGraduationDateChange = (event) => {
    setGraduationDate(event.target.value);

    clearSearchResults();
  };

  const clearSearchResults = () => {
    setStudents([]);
    setSelectedIds([]);
    setResults({});
    setSearchPerformed(false);
    setWalletFilter("all");
    setError("");
  };

  const handleFindStudents = (event) => {
    event.preventDefault();

    if (!graduationDate) {
      setError("Please select a graduation date.");
      return;
    }

    if (!faculty) {
      setError("Please select a faculty.");
      return;
    }

    if (!major) {
      setError("Please select a major.");
      return;
    }

    const matches = MOCK_STUDENTS.filter(
      (student) =>
        student.graduationDate === graduationDate &&
        student.faculty === faculty &&
        student.major === major,
    );

    setStudents(matches);

    /*
      Important:
      Do NOT automatically select students.

      The registrar must explicitly:
      - choose individual students, or
      - click Select All Connected.
    */
    setSelectedIds([]);

    setResults({});
    setWalletFilter("all");
    setError("");
    setSearchPerformed(true);
  };

  const handleWalletFilterChange = (filter) => {
    /*
      Filtering only controls what is displayed.

      It does NOT:
      - add students to selection
      - remove students from selection
    */
    setWalletFilter(filter);
  };

  const handleSelectAllConnected = () => {
    const visibleConnectedIds = visibleConnectedStudents.map(
      (student) => student.id,
    );

    setSelectedIds((current) => [
      ...new Set([...current, ...visibleConnectedIds]),
    ]);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleStudentToggle = (student) => {
    if (!student.walletConnected || isIssuing) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(student.id)
        ? current.filter((id) => id !== student.id)
        : [...current, student.id],
    );
  };

  const issueOneTranscript = async (student) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      studentId: student.id,
      success: true,
    };
  };

  const handleBatchIssue = async () => {
    if (selectedStudents.length === 0) {
      setError("Select at least one student with a connected wallet.");
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
          issueError,
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
    (result) => result.status === "success",
  ).length;

  const failedCount = Object.values(results).filter(
    (result) => result.status === "failed",
  ).length;

  return (
    <div className="batch-page">
      {/* ====================================
          PAGE HEADING
      ==================================== */}

      <div className="batch-page-heading">
        <div>
          <p className="batch-eyebrow">Transcript Issuance</p>

          <h1>Batch Issue Transcripts</h1>

          <p>
            Select a graduation date, faculty and major to find graduating
            students and issue their official AU Transcript Verifiable
            Credentials.
          </p>
        </div>
      </div>

      {/* ====================================
          SEARCH FILTERS
      ==================================== */}

      <section className="batch-card">
        <div className="batch-card-heading">
          <div className="batch-heading-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2>Find Graduating Students</h2>

            <p>Select graduation date, faculty and major.</p>
          </div>
        </div>

        <form className="batch-filter-form" onSubmit={handleFindStudents}>
          {/* Graduation Date */}

          <div className="batch-form-field">
            <label htmlFor="graduation-date">Graduation Date</label>

            <input
              id="graduation-date"
              type="date"
              value={graduationDate}
              onChange={handleGraduationDateChange}
            />
          </div>

          {/* Faculty */}

          <div className="batch-form-field">
            <label htmlFor="faculty">Faculty</label>

            <select id="faculty" value={faculty} onChange={handleFacultyChange}>
              <option value="">Select Faculty</option>

              {FACULTIES.map((facultyItem) => (
                <option key={facultyItem.name} value={facultyItem.name}>
                  {facultyItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* Major */}

          <div className="batch-form-field">
            <label htmlFor="major">Major</label>

            <select
              id="major"
              value={major}
              onChange={handleMajorChange}
              disabled={!faculty}
            >
              <option value="">
                {faculty ? "Select Major" : "Select Faculty First"}
              </option>

              {availableMajors.map((majorName) => (
                <option key={majorName} value={majorName}>
                  {majorName}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="batch-primary-button">
            <Users size={17} />
            Find Students
          </button>
        </form>

        {error && <p className="batch-error">{error}</p>}

        <p className="batch-demo-hint">
          Demo:
          <strong>
            {" "}
            24 May 2026 → Vincent Mary School of Science and Technology →
            Computer Science
          </strong>
        </p>
      </section>

      {/* ====================================
          NO STUDENTS FOUND
      ==================================== */}

      {searchPerformed && students.length === 0 && (
        <section className="batch-empty-state">
          <Users size={32} />

          <h2>No graduating students found</h2>

          <p>
            No students match the selected graduation date, faculty and major.
          </p>
        </section>
      )}

      {/* ====================================
          STUDENTS FOUND
      ==================================== */}

      {students.length > 0 && (
        <>
          {/* Summary cards */}

          <section className="batch-summary-grid">
            <SummaryCard
              icon={Users}
              value={students.length}
              label="Students Found"
            />

            <SummaryCard
              icon={Wallet}
              value={connectedStudents.length}
              label="Wallet Connected"
            />

            <SummaryCard
              icon={XCircle}
              value={notConnectedStudents.length}
              label="Not Connected"
            />

            <SummaryCard
              icon={CheckCircle2}
              value={successCount}
              label="Successfully Sent"
            />
          </section>

          {/* Student table */}

          <section className="batch-card batch-students-card">
            {/* Heading */}

            <div className="batch-list-heading">
              <div>
                <h2>Graduating Students</h2>

                <p>
                  {students.length} student
                  {students.length !== 1 ? "s" : ""} found.
                </p>

                <div className="batch-selection-summary">
                  <span>{formatDate(graduationDate)}</span>

                  <span>•</span>

                  <span>{faculty}</span>

                  <span>•</span>

                  <span>{major}</span>
                </div>
              </div>
            </div>

            {/* =================================
                TABLE TOOLBAR
            ================================= */}

            <div className="batch-table-toolbar">
              {/* Wallet status filter */}

              <div className="wallet-filter-section">
                <span className="wallet-filter-label">Wallet Status</span>

                <div className="wallet-filter-buttons">
                  <button
                    type="button"
                    className={`wallet-filter-button ${
                      walletFilter === "all"
                        ? "wallet-filter-button-active"
                        : ""
                    }`}
                    onClick={() => handleWalletFilterChange("all")}
                  >
                    All
                    <span>{students.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`wallet-filter-button ${
                      walletFilter === "connected"
                        ? "wallet-filter-button-active"
                        : ""
                    }`}
                    onClick={() => handleWalletFilterChange("connected")}
                  >
                    Connected
                    <span>{connectedStudents.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`wallet-filter-button ${
                      walletFilter === "not-connected"
                        ? "wallet-filter-button-active"
                        : ""
                    }`}
                    onClick={() => handleWalletFilterChange("not-connected")}
                  >
                    Not Connected
                    <span>{notConnectedStudents.length}</span>
                  </button>
                </div>
              </div>

              {/* Selection controls */}

              <div className="batch-selection-buttons">
                <button
                  type="button"
                  className="batch-secondary-button"
                  onClick={handleSelectAllConnected}
                  disabled={
                    isIssuing ||
                    visibleConnectedStudents.length === 0 ||
                    allVisibleConnectedSelected
                  }
                >
                  Select All Connected
                </button>

                <button
                  type="button"
                  className="batch-clear-button"
                  onClick={handleClearSelection}
                  disabled={isIssuing || selectedIds.length === 0}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* =================================
                STUDENT TABLE
            ================================= */}

            <div className="batch-table-wrapper">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th className="batch-checkbox-column">Select</th>

                    <th>Student ID</th>

                    <th>Student</th>

                    <th>Major</th>

                    <th>CGPA</th>

                    <th>Wallet Status</th>

                    <th>Issuance</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const selected = selectedIds.includes(student.id);

                    const result = results[student.id];

                    return (
                      <tr
                        key={student.id}
                        className={
                          !student.walletConnected
                            ? "batch-row-not-connected"
                            : ""
                        }
                      >
                        {/* Selection */}

                        <td className="batch-checkbox-column">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!student.walletConnected || isIssuing}
                            onChange={() => handleStudentToggle(student)}
                          />
                        </td>

                        {/* Student ID */}

                        <td className="batch-student-id">{student.id}</td>

                        {/* Name */}

                        <td>
                          <strong>{student.name}</strong>
                        </td>

                        {/* Major */}

                        <td>{student.major}</td>

                        {/* CGPA */}

                        <td>{student.cgpa}</td>

                        {/* Wallet status */}

                        <td>
                          {student.walletConnected ? (
                            <span className="wallet-status wallet-status-connected">
                              <CheckCircle2 size={13} />
                              Connected
                            </span>
                          ) : (
                            <span className="wallet-status wallet-status-not-connected">
                              <XCircle size={13} />
                              Not Connected
                            </span>
                          )}
                        </td>

                        {/* Issuance */}

                        <td>
                          {student.walletConnected ? (
                            <IssuanceResult result={result} />
                          ) : (
                            <span className="batch-result-unavailable">
                              Cannot Issue
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Empty status-filter result */}

              {filteredStudents.length === 0 && (
                <div className="batch-filter-empty">
                  <Users size={26} />

                  <p>No students match this wallet status.</p>
                </div>
              )}
            </div>

            {/* =================================
                ACTION FOOTER
            ================================= */}

            <div className="batch-action-footer">
              <div>
                <strong>{selectedStudents.length}</strong> connected student
                {selectedStudents.length !== 1 ? "s" : ""} selected
              </div>

              <button
                type="button"
                className="batch-issue-button"
                disabled={selectedStudents.length === 0 || isIssuing}
                onClick={handleBatchIssue}
              >
                {isIssuing ? (
                  <>
                    <LoaderCircle className="batch-spinner" size={17} />
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

          {/* ====================================
              SUCCESS
          ==================================== */}

          {successCount > 0 &&
            !isIssuing &&
            successCount === selectedStudents.length && (
              <section className="batch-success-message">
                <CheckCircle2 size={23} />

                <div>
                  <h3>Batch issuance completed</h3>

                  <p>
                    {successCount} transcript credential
                    {successCount !== 1 ? "s were" : " was"} generated, signed
                    and sent to the students' wallets.
                  </p>
                </div>
              </section>
            )}

          {/* ====================================
              FAILED
          ==================================== */}

          {failedCount > 0 && (
            <section className="batch-failed-message">
              <XCircle size={20} />
              {failedCount} transcript issuance
              {failedCount !== 1 ? "s" : ""} failed.
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
    return <span className="batch-result-idle">Ready</span>;
  }

  if (result.status === "processing") {
    return (
      <span className="batch-result-processing">
        <LoaderCircle size={14} className="batch-spinner" />
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
