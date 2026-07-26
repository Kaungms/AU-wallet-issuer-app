import { useState } from "react";
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
  cgpa: "3.42",
  totalCredits: "96",
  walletDid: "did:key:z6MkiAUStudentWallet6512345",

  courses: [
    {
      code: "CSX3001",
      name: "Data Structures and Algorithms",
      credits: 3,
      grade: "A",
      semester: "1/2025",
    },
    {
      code: "CSX3002",
      name: "Database Management Systems",
      credits: 3,
      grade: "B+",
      semester: "1/2025",
    },
    {
      code: "CSX3003",
      name: "Operating Systems",
      credits: 3,
      grade: "B",
      semester: "1/2025",
    },
    {
      code: "CSX4203",
      name: "Machine Learning",
      credits: 3,
      grade: "A",
      semester: "2/2025",
    },
    {
      code: "ITX4285",
      name: "Artificial Intelligence",
      credits: 3,
      grade: "A-",
      semester: "2/2025",
    },
  ],
};

function IssueTranscript() {
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
        "Student not found. For this demo, use student ID 6512345."
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

      // Demo delay representing VC generation and digital signing.
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setIssuanceStatus("sending");

      // Demo delay representing delivery to the holder wallet.
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
      <div className="issue-page-heading">
        <div>
          <h1>Issue Transcript</h1>
          <p>
            Verify an AU student, review the official academic transcript, and
            send a signed verifiable credential to the student's wallet.
          </p>
        </div>

        <div className="issuer-status">
          <span className="issuer-status-dot" />
          Issuer service active
        </div>
      </div>

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

      <section className="issue-card student-search-card">
        <div className="card-heading">
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

            {searchError && (
              <p className="form-error-message">{searchError}</p>
            )}
          </div>
        </form>
      </section>

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

      {student && (
        <>
          <div className="issue-content-grid">
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
                <InfoRow
                  label="Admission year"
                  value={student.admissionYear}
                />
                <InfoRow
                  label="Academic status"
                  value={student.academicStatus}
                />
              </div>
            </section>

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
                <InfoRow
                  label="Holder DID"
                  value={student.walletDid}
                  mono
                />
                <InfoRow label="Signature" value="Ed25519 digital signature" />
                <InfoRow label="Format" value="JSON-LD" />
              </div>
            </section>
          </div>

          <section className="issue-card transcript-card">
            <div className="card-heading transcript-heading">
              <div>
                <h2>Official Academic Transcript</h2>
                <p>
                  Review the student's academic information before issuing the
                  credential.
                </p>
              </div>

              <div className="academic-summary">
                <div>
                  <span>CGPA</span>
                  <strong>{student.cgpa}</strong>
                </div>

                <div>
                  <span>Total credits</span>
                  <strong>{student.totalCredits}</strong>
                </div>
              </div>
            </div>

            <div className="transcript-table-container">
              <table className="transcript-table">
                <thead>
                  <tr>
                    <th>Course code</th>
                    <th>Course name</th>
                    <th>Semester</th>
                    <th>Credits</th>
                    <th>Grade</th>
                  </tr>
                </thead>

                <tbody>
                  {student.courses.map((course) => (
                    <tr key={`${course.code}-${course.semester}`}>
                      <td className="course-code">{course.code}</td>
                      <td>{course.name}</td>
                      <td>{course.semester}</td>
                      <td>{course.credits}</td>
                      <td>
                        <span className="grade-badge">{course.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="issue-card issuance-card">
            <div className="issuance-content">
              <div className="issuance-icon">✓</div>

              <div>
                <h2>Ready to Issue Transcript</h2>
                <p>
                  The transcript will be converted into a signed verifiable
                  credential and sent directly to the student's holder wallet.
                </p>

                <div className="issuance-checks">
                  <span>✓ Student identity verified</span>
                  <span>✓ Transcript loaded from AU records</span>
                  <span>✓ Holder wallet DID available</span>
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

          {issuanceStatus === "success" && (
            <section className="issuance-success-message">
              <div className="success-checkmark">✓</div>

              <div>
                <h2>Transcript successfully issued</h2>
                <p>
                  The signed transcript credential was sent to{" "}
                  <strong>{student.name}</strong>'s holder wallet.
                </p>
              </div>
            </section>
          )}

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

export default IssueTranscript;