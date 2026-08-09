import { useState } from "react";
import BatchTranscript from "../batch-transcript/BatchTranscript";
import "./issue-transcript.css";

const mockStudent = {
  studentId: "6512345",
  name: "Kaung Myat San",
  email: "kaungmyat.san@au.edu",
  faculty: "Vincent Mary School of Science and Technology",
  department: "Computer Science",
  program: "Bachelor of Science in Computer Science",
  admissionYear: "2022",
  academicStatus: "Active",
  cgpa: "3.54",
  totalCredits: "96",
  walletDid: "did:key:z6MkiAUStudentWallet6512345",

  transcript: [
    {
      semester: "2/2025",
      gpa: "3.63",
      credits: 20,
      courses: [
        {
          code: "BBA1005",
          name: "Essential Finance for Entrepreneurs",
          credits: 2,
          grade: "B+",
        },
        {
          code: "BG14036",
          name: "Professional Ethics Seminar VI",
          credits: 0,
          grade: "S",
        },
        {
          code: "CSX3007",
          name: "Computer Architecture",
          credits: 3,
          grade: "C+",
        },
        {
          code: "CSX3008",
          name: "Operating Systems",
          credits: 3,
          grade: "A-",
        },
        {
          code: "CSX4201",
          name: "Artificial Intelligence Concepts",
          credits: 3,
          grade: "A",
        },
        {
          code: "CSX4212",
          name: "Data Analytics",
          credits: 3,
          grade: "A",
        },
        {
          code: "ITX4502",
          name: "Tech Startup",
          credits: 3,
          grade: "A",
        },
        {
          code: "MU1002",
          name: "Pop Music Appreciation",
          credits: 3,
          grade: "A",
        },
      ],
    },

    {
      semester: "1/2025",
      gpa: "3.54",
      credits: 18,
      courses: [
        {
          code: "BG14035",
          name: "Professional Ethics Seminar V",
          credits: 0,
          grade: "S",
        },
        {
          code: "CSX3004",
          name: "Programming Languages",
          credits: 3,
          grade: "B-",
        },
        {
          code: "CSX3010",
          name: "Senior Project I",
          credits: 3,
          grade: "A-",
        },
        {
          code: "CSX4107",
          name: "Software Engineering",
          credits: 3,
          grade: "A",
        },
        {
          code: "CSX4108",
          name: "Web Application Development",
          credits: 3,
          grade: "B+",
        },
        {
          code: "ITX3005",
          name: "Information Technology Management",
          credits: 3,
          grade: "A",
        },
      ],
    },

    {
      semester: "2/2024",
      gpa: "3.48",
      credits: 18,
      courses: [
        {
          code: "CSX3001",
          name: "Data Structures and Algorithms",
          credits: 3,
          grade: "A",
        },
        {
          code: "CSX3002",
          name: "Database Management Systems",
          credits: 3,
          grade: "B+",
        },
        {
          code: "CSX3003",
          name: "Computer Networks",
          credits: 3,
          grade: "B",
        },
        {
          code: "CSX3005",
          name: "Software Design",
          credits: 3,
          grade: "A-",
        },
        {
          code: "GE1403",
          name: "Communication Skills",
          credits: 3,
          grade: "A",
        },
        {
          code: "MA1201",
          name: "Discrete Mathematics",
          credits: 3,
          grade: "B+",
        },
      ],
    },

    {
      semester: "1/2024",
      gpa: "3.42",
      credits: 18,
      courses: [
        {
          code: "CSX2001",
          name: "Object Oriented Programming",
          credits: 3,
          grade: "A",
        },
        {
          code: "CSX2002",
          name: "Computer Organization",
          credits: 3,
          grade: "B",
        },
        {
          code: "CSX2003",
          name: "Data Communication",
          credits: 3,
          grade: "B+",
        },
        {
          code: "MA2201",
          name: "Probability and Statistics",
          credits: 3,
          grade: "A-",
        },
        {
          code: "EN2001",
          name: "Academic English",
          credits: 3,
          grade: "A",
        },
        {
          code: "GE2001",
          name: "Ethics and Society",
          credits: 3,
          grade: "B+",
        },
      ],
    },
  ],
};

function IssueTranscript({ initialMode = "single" }) {
  const [mode, setMode] = useState(initialMode);

  return (
    <div className="issue-transcript-wrapper">
      <div className="issue-mode-tabs">
        <button
          type="button"
          className={`issue-mode-tab ${
            mode === "single" ? "issue-mode-tab-active" : ""
          }`}
          onClick={() => setMode("single")}
        >
          Single Issuance
        </button>

        <button
          type="button"
          className={`issue-mode-tab ${
            mode === "batch" ? "issue-mode-tab-active" : ""
          }`}
          onClick={() => setMode("batch")}
        >
          Batch Issuance
        </button>
      </div>

      {mode === "single" ? <SingleTranscript /> : <BatchTranscript />}
    </div>
  );
}

function SingleTranscript() {
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [issuanceStatus, setIssuanceStatus] = useState("ready");
  const [currentStep, setCurrentStep] = useState(1);

  const handleSearch = (event) => {
    event.preventDefault();

    const cleanedStudentId = studentId.trim();

    if (!cleanedStudentId) {
      setSearchError("Please enter a student ID.");
      setStudent(null);
      return;
    }

    if (cleanedStudentId !== mockStudent.studentId) {
      setSearchError(
        "Student not found. For this demo, use student ID 6512345.",
      );
      setStudent(null);
      return;
    }

    setStudent(mockStudent);
    setSearchError("");
    setIssuanceStatus("ready");
    setCurrentStep(2);
  };

  const handleClear = () => {
    setStudentId("");
    setStudent(null);
    setSearchError("");
    setIssuanceStatus("ready");
    setCurrentStep(1);
  };

  const handleIssueTranscript = async () => {
    if (!student) {
      return;
    }

    try {
      setIssuanceStatus("generating");
      setCurrentStep(3);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setIssuanceStatus("sending");

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setIssuanceStatus("success");
      setCurrentStep(4);
    } catch (error) {
      console.error("Transcript issuance failed:", error);
      setIssuanceStatus("error");
    }
  };

  const getButtonText = () => {
    if (issuanceStatus === "generating") {
      return "Generating and Signing...";
    }

    if (issuanceStatus === "sending") {
      return "Sending to Wallet...";
    }

    if (issuanceStatus === "success") {
      return "Transcript Sent";
    }

    return "Generate and Send Transcript VC";
  };

  const isProcessing =
    issuanceStatus === "generating" || issuanceStatus === "sending";

  return (
    <div className="issue-transcript-page">
      {/* ===============================
          PAGE HEADING
      =============================== */}

      <div className="issue-page-heading">
        <div>
          <p className="issue-eyebrow">Transcript Issuance</p>

          <h1>Issue Transcript</h1>

          <p>
            Verify an AU student, review the official academic transcript, and
            prepare the transcript credential for issuance to the student's
            wallet.
          </p>
        </div>
      </div>

      {/* ===============================
          PROGRESS
      =============================== */}

      <section className="issue-progress">
        <ProgressStep
          number="1"
          title="Find student"
          active={currentStep >= 1}
          completed={currentStep > 1}
        />

        <div
          className={`progress-line ${
            currentStep > 1 ? "progress-line-active" : ""
          }`}
        />

        <ProgressStep
          number="2"
          title="Review transcript"
          active={currentStep >= 2}
          completed={currentStep > 2}
        />

        <div
          className={`progress-line ${
            currentStep > 2 ? "progress-line-active" : ""
          }`}
        />

        <ProgressStep
          number="3"
          title="Generate and sign"
          active={currentStep >= 3}
          completed={currentStep > 3}
        />

        <div
          className={`progress-line ${
            currentStep > 3 ? "progress-line-active" : ""
          }`}
        />

        <ProgressStep
          number="4"
          title="Send to wallet"
          active={currentStep >= 4}
          completed={issuanceStatus === "success"}
        />
      </section>

      {/* ===============================
          STUDENT SEARCH
      =============================== */}

      <section className="issue-card student-search-card">
        <div className="issue-search-heading">
          <div className="issue-search-icon">⌕</div>

          <div>
            <h2>Find AU Student</h2>

            <p>Enter the student's official AU student ID.</p>
          </div>
        </div>

        <form className="student-search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <label htmlFor="student-id">Student ID</label>

            <div className="search-input-row">
              <input
                id="student-id"
                type="text"
                value={studentId}
                placeholder="Example: 6512345"
                onChange={(event) => setStudentId(event.target.value)}
              />

              <button className="primary-action-button" type="submit">
                Search Student
              </button>

              {student && (
                <button
                  className="secondary-action-button"
                  type="button"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </div>

            {searchError && <p className="form-error-message">{searchError}</p>}
          </div>
        </form>
      </section>

      {/* ===============================
          EMPTY STATE
      =============================== */}

      {!student && (
        <section className="empty-transcript-state">
          <div className="empty-state-icon">⌕</div>

          <h2>No student selected</h2>

          <p>
            Search for a student to load their information and official
            transcript from the AU database.
          </p>
        </section>
      )}

      {/* ===============================
          STUDENT FOUND
      =============================== */}

      {student && (
        <>
          <div className="issue-content-grid">
            {/* Student Information */}

            <section className="issue-card">
              <div className="card-heading">
                <div>
                  <h2>Student Information</h2>

                  <p>Information retrieved from the AU student database.</p>
                </div>

                <span className="verified-badge">Verified</span>
              </div>

              <div className="student-profile">
                <div className="student-avatar">
                  {student.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")}
                </div>

                <div>
                  <h3>{student.name}</h3>
                  <p>{student.studentId}</p>
                </div>
              </div>

              <div className="information-list">
                <InfoRow label="Email" value={student.email} />

                <InfoRow label="Faculty" value={student.faculty} />

                <InfoRow label="Department" value={student.department} />

                <InfoRow label="Program" value={student.program} />

                <InfoRow label="Admission year" value={student.admissionYear} />

                <InfoRow
                  label="Academic status"
                  value={student.academicStatus}
                />
              </div>
            </section>

            {/* Credential Information */}

            <section className="issue-card">
              <div className="card-heading">
                <div>
                  <h2>Credential Information</h2>

                  <p>Information used when generating the transcript VC.</p>
                </div>
              </div>

              <div className="credential-summary">
                <div className="credential-icon">VC</div>

                <div>
                  <h3>AU Academic Transcript</h3>
                  <p>W3C Verifiable Credential</p>
                </div>
              </div>

              <div className="information-list">
                <InfoRow
                  label="Credential type"
                  value="AcademicTranscriptCredential"
                />

                <InfoRow
                  label="Issuer"
                  value="Assumption University Registrar"
                />

                <InfoRow
                  label="Issuer DID"
                  value="did:web:au.edu:registrar"
                  mono
                />

                <InfoRow label="Holder DID" value={student.walletDid} mono />

                <InfoRow label="Signature" value="Ed25519 digital signature" />

                <InfoRow label="Format" value="JSON-LD" />
              </div>
            </section>
          </div>

          {/* ===============================
              TRANSCRIPT
          =============================== */}

          <section className="issue-card transcript-card">
            <div className="card-heading transcript-heading">
              <div>
                <h2>Official Academic Transcript</h2>

                <p>
                  Review the student's academic record semester by semester
                  before issuing the transcript credential.
                </p>
              </div>

              <div className="academic-summary">
                <div>
                  <span>CGPA</span>
                  <strong>{student.cgpa}</strong>
                </div>

                <div>
                  <span>Total Credits</span>
                  <strong>{student.totalCredits}</strong>
                </div>
              </div>
            </div>

            <div className="semester-list">
              {student.transcript.map((semester, index) => (
                <SemesterSection
                  key={semester.semester}
                  semester={semester}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          </section>

          {/* ===============================
              ISSUE ACTION
          =============================== */}

          <section className="issue-card issuance-card">
            <div className="issuance-content">
              <div className="issuance-icon">✓</div>

              <div>
                <h2>Ready to Issue Transcript</h2>

                <p>
                  Review the transcript information before proceeding with
                  credential issuance.
                </p>

                <div className="issuance-checks">
                  <span>✓ Student identity verified</span>

                  <span>✓ Transcript loaded from AU records</span>

                  <span>✓ Holder wallet available</span>
                </div>
              </div>
            </div>

            <button
              className="issue-credential-button"
              type="button"
              disabled={isProcessing || issuanceStatus === "success"}
              onClick={handleIssueTranscript}
            >
              {getButtonText()}
            </button>
          </section>

          {/* ===============================
              SUCCESS
          =============================== */}

          {issuanceStatus === "success" && (
            <section className="issuance-success-message">
              <div className="success-checkmark">✓</div>

              <div>
                <h2>Transcript successfully issued</h2>

                <p>
                  The transcript credential was issued for{" "}
                  <strong>{student.name}</strong>.
                </p>
              </div>
            </section>
          )}

          {/* ===============================
              ERROR
          =============================== */}

          {issuanceStatus === "error" && (
            <section className="issuance-error-message">
              The transcript could not be issued. Please try again.
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ProgressStep({ number, title, active, completed }) {
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

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="information-row">
      <span className="information-label">{label}</span>

      <span className={`information-value ${mono ? "mono-value" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function SemesterSection({ semester, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="semester-section">
      <button
        type="button"
        className="semester-header"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="semester-title-area">
          <span
            className={`semester-arrow ${isOpen ? "semester-arrow-open" : ""}`}
          >
            ›
          </span>

          <div>
            <h3>Term {semester.semester}</h3>

            <span className="semester-course-count">
              {semester.courses.length} courses
            </span>
          </div>
        </div>

        <div className="semester-summary">
          <div className="semester-gpa">
            <span>GPA</span>
            <strong>{semester.gpa}</strong>
          </div>

          <div className="semester-credits">
            <span>Credits</span>
            <strong>{semester.credits}</strong>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="semester-courses">
          {semester.courses.map((course) => (
            <div
              className="semester-course-row"
              key={`${semester.semester}-${course.code}`}
            >
              <div className="semester-course-information">
                <div className="semester-course-code">
                  {course.code}

                  <span>{course.credits} CR.</span>
                </div>

                <div className="semester-course-name">{course.name}</div>
              </div>

              <div className="semester-course-grade">{course.grade}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IssueTranscript;
