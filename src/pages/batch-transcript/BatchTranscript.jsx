import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Send,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  getGraduatingStudents,
  getIssuerPrograms,
  getIssuerStudents,
  resolveWalletEligibility,
} from "../../api/issuerApi";
import "./batch-transcript.css";

function BatchTranscript() {
  const [graduationDate, setGraduationDate] = useState("");
  const [facultyCode, setFacultyCode] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [filtersStatus, setFiltersStatus] = useState("loading");
  const [programsStatus, setProgramsStatus] = useState("idle");
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [walletFilter, setWalletFilter] = useState("all");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    async function loadFilterOptions() {
      try {
        const studentData = await getIssuerStudents({
          page: 1,
          pageSize: 100,
          signal: abortController.signal,
        });

        setFacultyOptions(buildFacultyOptions(studentData?.students ?? []));
        setFiltersStatus("ready");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setFiltersStatus("error");
          setError(requestError.message || "Graduation filters could not be loaded.");
          setStatus("error");
        }
      }
    }

    loadFilterOptions();

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (!facultyCode) {
      return undefined;
    }

    const abortController = new AbortController();

    async function loadProgramOptions() {
      setProgramsStatus("loading");

      try {
        const programData = await getIssuerPrograms({
          facultyCode,
          signal: abortController.signal,
        });

        setProgramOptions(programData.programs);
        setProgramsStatus("ready");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setProgramOptions([]);
          setProgramsStatus("error");
          setError(requestError.message || "Program options could not be loaded.");
          setStatus("error");
        }
      }
    }

    loadProgramOptions();

    return () => abortController.abort();
  }, [facultyCode]);

  const selectedFaculty = facultyOptions.find(
    (faculty) => faculty.code === facultyCode,
  );
  const selectedProgram = programOptions.find(
    (program) => program.programCode === programCode,
  );

  const connectedStudents = useMemo(
    () => students.filter((student) => student.walletEligibility === "verified"),
    [students],
  );

  const notConnectedStudents = useMemo(
    () => students.filter((student) => student.walletEligibility !== "verified"),
    [students],
  );

  const filteredStudents = useMemo(() => {
    if (walletFilter === "connected") {
      return connectedStudents;
    }

    if (walletFilter === "not-connected") {
      return notConnectedStudents;
    }

    return students;
  }, [connectedStudents, notConnectedStudents, students, walletFilter]);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.includes(student.studentNumber)),
    [selectedIds, students],
  );

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedIds.includes(student.studentNumber),
    );

  const clearResults = () => {
    setStudents([]);
    setSelectedIds([]);
    setWalletFilter("all");
    setStatus("idle");
    setError("");
  };

  const handleGraduationDateChange = (event) => {
    setGraduationDate(event.target.value);
    clearResults();
  };

  const handleFacultyChange = (event) => {
    setFacultyCode(event.target.value);
    setProgramCode("");
    setProgramOptions([]);
    clearResults();
  };

  const handleProgramChange = (event) => {
    setProgramCode(event.target.value);
    clearResults();
  };

  const handleFindStudents = async (event) => {
    event.preventDefault();

    if (!graduationDate || !facultyCode || !programCode) {
      setError("Select a graduation date, faculty, and program.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const graduatingData = await getGraduatingStudents({
        graduationDate,
        facultyCode,
        programCode,
      });
      const graduatingStudents = Array.isArray(graduatingData?.students)
        ? graduatingData.students
        : [];

      if (graduatingStudents.length === 0) {
        setStudents([]);
        setSelectedIds([]);
        setStatus("empty");
        return;
      }

      const eligibilityData = await resolveWalletEligibility(
        graduatingStudents.map((student) => student.studentNumber),
      );
      const eligibilityByStudent = new Map(
        (eligibilityData?.results ?? []).map((result) => [
          result.studentNumber,
          result.status,
        ]),
      );

      setStudents(
        graduatingStudents.map((student) => ({
          ...student,
          walletEligibility:
            eligibilityByStudent.get(student.studentNumber) ??
            student.walletEligibility ??
            "not_verified",
        })),
      );
      setSelectedIds([]);
      setWalletFilter("all");
      setStatus("ready");
    } catch (requestError) {
      setStudents([]);
      setSelectedIds([]);
      setError(requestError.message || "Graduating students could not be loaded.");
      setStatus("error");
    }
  };

  const handleStudentToggle = (student) => {
    setSelectedIds((current) =>
      current.includes(student.studentNumber)
        ? current.filter((id) => id !== student.studentNumber)
        : [...current, student.studentNumber],
    );
  };

  const handleSelectAllVisible = () => {
    const visibleStudentIds = filteredStudents.map(
      (student) => student.studentNumber,
    );

    setSelectedIds((current) => [
      ...new Set([...current, ...visibleStudentIds]),
    ]);
  };

  return (
    <div className="batch-page">
      <div className="batch-page-heading">
        <div>
          <p className="batch-eyebrow">Pre-issuance preparation</p>
          <h1>Batch Transcript Preparation</h1>
          <p>
            Filter graduating-student database records, review wallet
            eligibility, and prepare a pre-issuance selection.
          </p>
        </div>
      </div>

      <section className="batch-sample-notice" role="note">
        <strong>Issuer database connected</strong>
        <span>
          Graduation results and wallet eligibility are loaded from NestJS.
        </span>
      </section>

      <section className="batch-card">
        <div className="batch-card-heading">
          <div className="batch-heading-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2>Find Graduating Students</h2>
            <p>Select graduation date, faculty, and program.</p>
          </div>
        </div>

        <form className="batch-filter-form" onSubmit={handleFindStudents}>
          <div className="batch-form-field">
            <label htmlFor="graduation-date">Graduation Date</label>
            <input
              id="graduation-date"
              type="date"
              value={graduationDate}
              onChange={handleGraduationDateChange}
            />
          </div>

          <div className="batch-form-field">
            <label htmlFor="faculty">Faculty</label>
            <select
              id="faculty"
              value={facultyCode}
              onChange={handleFacultyChange}
              disabled={filtersStatus !== "ready"}
            >
              <option value="">Select Faculty</option>
              {facultyOptions.map((faculty) => (
                <option key={faculty.code} value={faculty.code}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="batch-form-field">
            <label htmlFor="program">Program</label>
            <select
              id="program"
              value={programCode}
              onChange={handleProgramChange}
              disabled={!facultyCode || programsStatus !== "ready"}
            >
              <option value="">
                {!facultyCode
                  ? "Select Faculty First"
                  : programsStatus === "loading"
                    ? "Loading Programs…"
                    : programsStatus === "error"
                      ? "Programs Unavailable"
                      : "Select Program"}
              </option>
              {programOptions.map((program) => (
                <option
                  key={program.programCode}
                  value={program.programCode}
                >
                  {formatProgram(program)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="batch-primary-button"
            disabled={
              filtersStatus !== "ready" ||
              programsStatus !== "ready" ||
              status === "loading"
            }
          >
            <Users size={17} />
            Find Students
          </button>
        </form>

      </section>

      {status === "loading" && (
        <BatchState title="Loading students…" message="Loading batch results." />
      )}

      {status === "error" && (
        <BatchState title="Unable to load batch" message={error} isError />
      )}

      {status === "empty" && (
        <BatchState
          title="No graduating students found"
          message="No database records match the selected filters."
        />
      )}

      {status === "idle" && (
        <BatchState
          title="No batch loaded"
          message="Choose all three filters to load graduating students."
        />
      )}

      {status === "ready" && (
        <>
          <section className="batch-summary-grid">
            <SummaryCard icon={Users} value={students.length} label="Students Found" />
            <SummaryCard icon={Wallet} value={connectedStudents.length} label="Wallet Verified" />
            <SummaryCard icon={CheckCircle2} value={selectedStudents.length} label="Selected" />
          </section>

          <section className="batch-card batch-students-card">
            <div className="batch-list-heading">
              <div>
                <h2>Graduating Students</h2>
                <p>{students.length} database records found.</p>
                <div className="batch-selection-summary">
                  <span>{formatDate(graduationDate)}</span>
                  <span>•</span>
                  <span>{selectedFaculty?.name ?? facultyCode}</span>
                  <span>•</span>
                  <span>
                    {selectedProgram
                      ? formatProgram(selectedProgram)
                      : "Selected program"}
                  </span>
                </div>
              </div>
            </div>

            <div className="batch-table-toolbar">
              <div className="wallet-filter-section">
                <span className="wallet-filter-label">Wallet eligibility</span>
                <div className="wallet-filter-buttons">
                  <WalletFilterButton
                    label="All"
                    count={students.length}
                    active={walletFilter === "all"}
                    onClick={() => setWalletFilter("all")}
                  />
                  <WalletFilterButton
                    label="Verified"
                    count={connectedStudents.length}
                    active={walletFilter === "connected"}
                    onClick={() => setWalletFilter("connected")}
                  />
                  <WalletFilterButton
                    label="Not verified"
                    count={notConnectedStudents.length}
                    active={walletFilter === "not-connected"}
                    onClick={() => setWalletFilter("not-connected")}
                  />
                </div>
              </div>

              <div className="batch-selection-buttons">
                <button
                  type="button"
                  className="batch-secondary-button"
                  onClick={handleSelectAllVisible}
                  disabled={filteredStudents.length === 0 || allVisibleSelected}
                >
                  Select All Results
                </button>
                <button
                  type="button"
                  className="batch-clear-button"
                  onClick={() => {
                    setSelectedIds([]);
                  }}
                  disabled={selectedIds.length === 0}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="batch-table-wrapper">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th className="batch-checkbox-column">Select</th>
                    <th>Student number</th>
                    <th>Student</th>
                    <th>Major</th>
                    <th>Academic status</th>
                    <th>Wallet Eligibility</th>
                    <th>Preparation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const verified = student.walletEligibility === "verified";
                    const selected = selectedIds.includes(student.studentNumber);

                    return (
                      <tr
                        key={student.studentNumber}
                        className={!verified ? "batch-row-not-connected" : ""}
                      >
                        <td className="batch-checkbox-column">
                          <input
                            type="checkbox"
                            aria-label={`Select ${student.fullName}`}
                            checked={selected}
                            onChange={() => handleStudentToggle(student)}
                          />
                        </td>
                        <td className="batch-student-id">{student.studentNumber}</td>
                        <td><strong>{student.fullName}</strong></td>
                        <td>{student.major}</td>
                        <td>{formatStatus(student.academicStatus)}</td>
                        <td><WalletStatus status={student.walletEligibility} /></td>
                        <td>
                          <span
                            className="batch-result-unavailable"
                          >
                            {getPreparationStatus(student)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div className="batch-filter-empty">
                  <Users size={26} />
                  <p>No students match this wallet filter.</p>
                </div>
              )}
            </div>

            <div className="batch-action-footer">
              <div>
                <strong>{selectedStudents.length}</strong> student
                {selectedStudents.length !== 1 ? "s" : ""} selected
              </div>
              <button
                type="button"
                className="batch-issue-button"
                disabled
              >
                <Send size={17} />
                Credential issuance unavailable
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function buildFacultyOptions(students) {
  const faculties = new Map();

  students.forEach((student) => {
    if (!student.facultyCode) {
      return;
    }

    if (!faculties.has(student.facultyCode)) {
      faculties.set(student.facultyCode, {
        code: student.facultyCode,
        name: student.facultyName || student.facultyCode,
      });
    }
  });

  return [...faculties.values()];
}

function getPreparationStatus(student) {
  const candidateStatusKnown =
    typeof student.requirementsFulfilled === "boolean" &&
    Boolean(student.graduationStatus);
  const academicStatusAccepted = ["graduated", "alumni"].includes(
    student.academicStatus,
  );

  if (
    candidateStatusKnown &&
    academicStatusAccepted &&
    student.requirementsFulfilled &&
    student.graduationStatus === "completed"
  ) {
    return "Candidate criteria met";
  }

  return candidateStatusKnown ? "Academic review required" : "Open review required";
}

function formatProgram(student) {
  const degree = student.degreeName?.trim();
  const major = student.major?.trim();
  const concentration = student.majorConcentration?.trim();
  const degreeAndMajor =
    degree && major ? `${degree} — ${major}` : degree || major || "Program";

  return concentration
    ? `${degreeAndMajor} — ${concentration}`
    : degreeAndMajor;
}

function formatStatus(value) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function BatchState({ title, message, isError = false }) {
  return (
    <section
      className={`batch-empty-state ${isError ? "batch-state-error" : ""}`}
      role={isError ? "alert" : "status"}
    >
      {isError ? <XCircle size={32} /> : <Users size={32} />}
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
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

function WalletFilterButton({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`wallet-filter-button ${
        active ? "wallet-filter-button-active" : ""
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
      <span>{count}</span>
    </button>
  );
}

function WalletStatus({ status }) {
  return status === "verified" ? (
    <span className="wallet-status wallet-status-connected">
      <CheckCircle2 size={13} /> Verified
    </span>
  ) : (
    <span className="wallet-status wallet-status-not-connected">
      <XCircle size={13} /> Not verified
    </span>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default BatchTranscript;
