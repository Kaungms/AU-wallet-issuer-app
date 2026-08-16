import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileClock, Search, Wallet, XCircle } from "lucide-react";

import {
  createAcademicTranscriptVc,
  getStudentAcademicPreview,
  getStudentAcademicReview,
} from "../../api/issuerApi";
import { useNotifications } from "../../context/NotificationContext";
import BatchTranscript from "../batch-transcript/BatchTranscript";
import "./issue-transcript.css";

function IssueTranscript({
  initialMode = "single",
  initialStudentId = "",
  onModeChange,
  onStudentChange,
}) {
  const [mode, setMode] = useState(initialMode);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  return (
    <div className="issue-transcript-wrapper">
      <div
        className="issue-mode-tabs"
        role="tablist"
        aria-label="Preparation mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "single"}
          className={`issue-mode-tab ${
            mode === "single" ? "issue-mode-tab-active" : ""
          }`}
          onClick={() => handleModeChange("single")}
        >
          Single Preparation
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "batch"}
          className={`issue-mode-tab ${
            mode === "batch" ? "issue-mode-tab-active" : ""
          }`}
          onClick={() => handleModeChange("batch")}
        >
          Batch Preparation
        </button>
      </div>

      {mode === "single" ? (
        <SingleTranscript
          initialStudentId={initialStudentId}
          onStudentChange={onStudentChange}
        />
      ) : (
        <BatchTranscript />
      )}
    </div>
  );
}

function SingleTranscript({ initialStudentId, onStudentChange }) {
  const [studentId, setStudentId] = useState(initialStudentId);
  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState(initialStudentId ? "loading" : "idle");
  const [error, setError] = useState("");

  const loadStudent = useCallback(async (studentNumber, signal) => {
    setStatus("loading");
    setError("");

    try {
      const loadedStudent = await fetchStudentReview(studentNumber, signal);

      setStudent(loadedStudent);
      setStatus("ready");
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setStudent(null);
        setError(
          requestError.message || "Academic review could not be loaded.",
        );
        setStatus(requestError.status === 404 ? "empty" : "error");
      }
    }
  }, []);

  useEffect(() => {
    if (!initialStudentId) {
      return undefined;
    }

    const abortController = new AbortController();

    async function loadInitialStudent() {
      try {
        const loadedStudent = await fetchStudentReview(
          initialStudentId,
          abortController.signal,
        );

        setStudent(loadedStudent);
        setStatus("ready");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setStudent(null);
          setError(
            requestError.message || "Academic review could not be loaded.",
          );
          setStatus(requestError.status === 404 ? "empty" : "error");
        }
      }
    }

    loadInitialStudent();

    return () => abortController.abort();
  }, [initialStudentId]);

  const handleSearch = async (event) => {
    event.preventDefault();

    const cleanedStudentId = studentId.trim();

    if (!cleanedStudentId) {
      setError("Enter a student number.");
      setStudent(null);
      setStatus("error");
      return;
    }

    if (cleanedStudentId !== initialStudentId) {
      onStudentChange?.(cleanedStudentId);
      return;
    }

    await loadStudent(cleanedStudentId);
  };

  const handleClear = () => {
    setStudentId("");
    setStudent(null);
    setStatus("idle");
    setError("");
    onStudentChange?.("");
  };

  return (
    <div className="issue-transcript-page">


      <section className="issue-card student-search-card">
        <div className="issue-search-heading">
          <div className="issue-search-icon">
            <Search size={18} />
          </div>
          <div>
            <h2>Find Student</h2>
            <p>Load an AU academic review by student number.</p>
          </div>
        </div>

        <form className="student-search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <label htmlFor="student-id">Student number</label>
            <div className="search-input-row">
              <input
                id="student-id"
                type="text"
                value={studentId}
                placeholder="Try 6499002"
                onChange={(event) => setStudentId(event.target.value)}
              />
              <button className="primary-action-button" type="submit">
                Find Student
              </button>
              {(student || studentId) && (
                <button
                  className="secondary-action-button"
                  type="button"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </div>
            <p className="issue-form-note" role="note">
              Academic review, preview, and wallet eligibility are loaded from
              the issuer backend.
            </p>
          </div>
        </form>
      </section>

      {status === "loading" && (
        <ReviewState
          title="Loading student…"
          message="Loading academic preview."
        />
      )}

      {status === "error" && (
        <ReviewState title="Search needs attention" message={error} isError />
      )}

      {status === "empty" && (
        <ReviewState
          title="Student record not found"
          message="Check the student number and try again."
        />
      )}

      {status === "idle" && (
        <ReviewState
          title="No student selected"
          message="Enter a student number to load the pre-issuance review."
        />
      )}

      {status === "ready" && student && (
        <StudentAcademicReview student={student} />
      )}
    </div>
  );
}

async function fetchStudentReview(studentNumber, signal) {
  const [review, preview] = await Promise.all([
    getStudentAcademicReview(studentNumber, { signal }),
    getStudentAcademicPreview(studentNumber, { signal }),
  ]);

  return {
    ...review,
    walletEligibility: review.walletEligibility ?? "not_verified",
    cumulativeGpa: review.cumulativeGpa ?? preview.cumulativeGpa ?? null,
    totalEarnedCredits:
      review.creditSummary?.earned ?? preview.totalEarnedCredits ?? null,
    transferCredits:
      review.creditSummary?.transferred ?? preview.transferCredits ?? null,
    terms: preview.terms,
    unassignedResults: preview.unassignedResults ?? [],
  };
}

function StudentAcademicReview({ student }) {
  const { addNotification } = useNotifications();
  const walletVerified = student.walletEligibility === "verified";
  const [issuanceStatus, setIssuanceStatus] = useState("idle");
  const [issuanceError, setIssuanceError] = useState("");
  const [issuanceResult, setIssuanceResult] = useState(null);

  const handleCreateVc = async () => {
    setIssuanceStatus("loading");
    setIssuanceError("");
    setIssuanceResult(null);

    try {
      const createdVc = await createAcademicTranscriptVc(student.studentNumber);

      setIssuanceResult(createdVc);
      setIssuanceStatus("success");
      addNotification({
        type: "vc-created",
        title: "Transcript VC created",
        message: `A transcript VC was created for ${student.fullName} (${student.studentNumber}).`,
        actionPage: "issue-transcript",
      });
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setIssuanceStatus("error");
        setIssuanceError(
          requestError.message || "The VC could not be created.",
        );
      }
    }
  };

  return (
    <>
      <section className="issue-progress" aria-label="Preparation progress">
        <ProgressStep number="1" title="Find student" completed />
        <div className="progress-line progress-line-active" />
        <ProgressStep number="2" title="Review academics" active />
        <div className="progress-line" />
        <ProgressStep number="3" title="Create VC" />
      </section>

      <section className="issue-sample-notice" role="note">
        <strong>Issuer database record</strong>
        <span>
          Academic review and course preview loaded from NestJS. This is not a
          certified transcript.
        </span>
      </section>

      <div className="issue-content-grid">
        <section className="issue-card">
          <div className="card-heading">
            <div>
              <h2>Student Review</h2>
              <p>Minimum identity and program data needed for issuer review.</p>
            </div>
            <span className="verified-badge">Database</span>
          </div>

          <div className="student-profile">
            <div className="student-avatar">AU</div>
            <div>
              <h3>{student.fullName}</h3>
              <p>{student.studentNumber}</p>
            </div>
          </div>

          <div className="information-list">
            <InfoRow label="Faculty" value={student.facultyName} />
            <InfoRow label="Degree" value={student.degreeName} />
            <InfoRow label="Major" value={student.major} />
            <InfoRow label="Concentration" value={student.majorConcentration} />
            <InfoRow
              label="Admission date"
              value={formatDate(student.admissionDate)}
            />
            <InfoRow
              label="Graduation date"
              value={formatDate(student.graduationDate)}
            />
            <InfoRow
              label="Academic status"
              value={formatStatus(student.academicStatus)}
            />
            <InfoRow
              label="Graduation status"
              value={formatStatus(student.graduationStatus)}
            />
            <InfoRow
              label="Requirements fulfilled"
              value={formatBoolean(student.requirementsFulfilled)}
            />
            <InfoRow label="Required credits" value={student.requiredCredits} />
            <InfoRow
              label="AU-completed credits"
              value={student.creditSummary?.completed}
            />
            <InfoRow
              label="Transferred credits"
              value={student.creditSummary?.transferred}
            />
            <InfoRow
              label="Credits toward degree"
              value={student.creditSummary?.earned}
            />
            <InfoRow label="Award" value={student.award} />
          </div>
        </section>

        <section className="issue-card">
          <div className="card-heading">
            <div>
              <h2>Wallet Eligibility</h2>
              <p>
                Wallet verification is shown as a warning and does not block
                pre-issuance review or selection.
              </p>
            </div>
          </div>

          <div className="credential-summary">
            <div className="credential-icon">
              <Wallet size={18} />
            </div>
            <div>
              <h3>
                {walletVerified
                  ? "Verified AU wallet connection"
                  : "Wallet connection not verified"}
              </h3>
              <p>
                {walletVerified
                  ? "Connection is ready for a later delivery check"
                  : "Selection can continue; wallet delivery needs a later check"}
              </p>
            </div>
          </div>

          <div className="information-list">
            <InfoRow
              label="Connection status"
              value={walletVerified ? "Verified" : "Not verified"}
            />
            <InfoRow label="Pre-issuance selection" value="Available" />
          </div>
        </section>
      </div>

      <section className="issue-card transcript-card">
        <div className="card-heading transcript-heading">
          <div>
            <h2>Academic Record</h2>
            <p>
              Review term and course results before any future issuance step.
            </p>
          </div>
          <div className="academic-summary">
            <div>
              <span>CGPA</span>
              <strong>{formatValue(student.cumulativeGpa)}</strong>
            </div>
            <div>
              <span>Total Credits</span>
              <strong>{formatValue(student.totalEarnedCredits)}</strong>
            </div>
          </div>
        </div>

        <div className="semester-list">
          {student.terms.length > 0 ? (
            student.terms.map((term, index) => (
              <SemesterSection
                key={term.termCode}
                term={term}
                defaultOpen={index === 0}
              />
            ))
          ) : (
            <div className="academic-preview-empty">
              No term results recorded.
            </div>
          )}

          {student.unassignedResults.length > 0 && (
            <UnassignedResults results={student.unassignedResults} />
          )}
        </div>
      </section>

      <section className="issue-card issuance-card">
        <div className="issuance-content">
          <div
            className={`issuance-icon ${
              walletVerified ? "" : "issuance-icon-warning"
            }`}
          >
            {walletVerified ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
          </div>
          <div>
            <h2>Ready to create VC</h2>
            <p>
              The reviewed student and academic record remain selected. The
              button below now calls the backend VC creation route for this
              exact student record.
            </p>
          </div>
        </div>

        <button
          className="issue-credential-button"
          type="button"
          disabled={issuanceStatus === "loading"}
          onClick={handleCreateVc}
        >
          {issuanceStatus === "loading" ? "Creating VC…" : "Create VC"}
        </button>

        {issuanceStatus === "success" && (
          <div className="issuance-success-message" role="status">
            <div className="success-checkmark">✓</div>
            <div>
              <h2>VC created for {student.fullName}</h2>
              <p>
                Student {student.studentNumber} was sent to the backend VC
                route.
                {issuanceResult?.credentialId
                  ? ` Credential ID: ${issuanceResult.credentialId}.`
                  : ""}
              </p>
            </div>
          </div>
        )}

        {issuanceStatus === "error" && (
          <div className="issuance-error-message" role="alert">
            {issuanceError}
          </div>
        )}
      </section>
    </>
  );
}

function ReviewState({ title, message, isError = false }) {
  return (
    <section
      className="empty-transcript-state"
      role={isError ? "alert" : "status"}
    >
      <div className="empty-state-icon">
        <FileClock size={20} />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

function ProgressStep({ number, title, active = false, completed = false }) {
  return (
    <div
      className={`progress-step ${active ? "progress-step-active" : ""} ${
        completed ? "progress-step-completed" : ""
      }`}
    >
      <div className="progress-number">{completed ? "✓" : number}</div>
      <span>{title}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="information-row">
      <span className="information-label">{label}</span>
      <span className="information-value">{formatValue(value)}</span>
    </div>
  );
}

function SemesterSection({ term, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const courses = Array.isArray(term.courses) ? term.courses : [];

  return (
    <div className="semester-section">
      <button
        type="button"
        className="semester-header"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="semester-title-area">
          <span
            className={`semester-arrow ${isOpen ? "semester-arrow-open" : ""}`}
          >
            ›
          </span>
          <div>
            <h3>{term.termLabel}</h3>
            <span className="semester-course-count">
              {courses.length} courses
            </span>
          </div>
        </div>

        <div className="semester-summary">
          <div className="semester-gpa">
            <span>GPA</span>
            <strong>{formatValue(term.gpa)}</strong>
          </div>
          <div className="semester-credits">
            <span>Credits</span>
            <strong>{formatValue(term.earnedCredits)}</strong>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="semester-courses">
          {courses.map((course, courseIndex) => (
            <div
              className="semester-course-row"
              key={`${term.termCode}-${course.courseCode}-${courseIndex}`}
            >
              <div className="semester-course-information">
                <div className="semester-course-code">
                  {course.courseCode}
                  <span>{course.credits} CR.</span>
                </div>
                <div className="semester-course-name">
                  {course.courseTitle}
                  <span className="course-result-type">
                    {formatStatus(course.resultType)}
                  </span>
                </div>
              </div>
              <div className="semester-course-grade">{course.grade}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UnassignedResults({ results }) {
  return (
    <div className="semester-section">
      <div className="unassigned-results-heading">
        <h3>Results without an assigned term</h3>
        <span>{results.length} results</span>
      </div>
      <div className="semester-courses">
        {results.map((course, index) => (
          <div
            className="semester-course-row"
            key={`${course.courseCode ?? "unassigned"}-${index}`}
          >
            <div className="semester-course-information">
              <div className="semester-course-code">
                {course.courseCode ?? "Course code unavailable"}
                <span>{formatValue(course.credits)} CR.</span>
              </div>
              <div className="semester-course-name">
                {course.courseTitle ?? "Course title unavailable"}
                <span className="course-result-type">
                  {formatStatus(course.resultType)}
                </span>
              </div>
            </div>
            <div className="semester-course-grade">
              {formatValue(course.grade)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(value) {
  return value === undefined || value === null || value === ""
    ? "Not recorded"
    : value;
}

function formatBoolean(value) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not recorded";
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

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
  }).format(date);
}

export default IssueTranscript;
