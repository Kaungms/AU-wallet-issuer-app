import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Send, Users, Wallet, XCircle } from "lucide-react";

import {
  createAcademicTranscriptVc,
  getGraduatingStudents,
  getIssuerPrograms,
  getIssuerStudents,
  getIssuedCredentials,
  revokeCredential,
  resolveWalletEligibility,
} from "../../api/issuerApi";
import { useNotifications } from "../../context/NotificationContext";
import "./batch-transcript.css";

function BatchTranscript() {
  const { addNotification } = useNotifications();
  const [graduationYear, setGraduationYear] = useState("");
  const [facultyCode, setFacultyCode] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [yearDefaultsPending, setYearDefaultsPending] = useState(false);
  const [yearDefaultsRequest, setYearDefaultsRequest] = useState(0);
  const [filtersStatus, setFiltersStatus] = useState("loading");
  const [programsStatus, setProgramsStatus] = useState("idle");
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [walletFilter, setWalletFilter] = useState("all");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [issuanceStatus, setIssuanceStatus] = useState("idle");
  const [issuanceSummary, setIssuanceSummary] = useState(null);
  const [revokeSelectionIds, setRevokeSelectionIds] = useState([]);

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
          setError(
            requestError.message || "Graduation filters could not be loaded.",
          );
          setStatus("error");
        }
      }
    }

    loadFilterOptions();

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (
      !yearDefaultsPending ||
      !graduationYear ||
      filtersStatus !== "ready" ||
      facultyOptions.length === 0
    ) {
      return undefined;
    }

    setFacultyCode(facultyOptions[0].code);
    setProgramCode("");
    setProgramOptions([]);

    return undefined;
  }, [facultyOptions, filtersStatus, graduationYear, yearDefaultsPending]);

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
        setProgramCode(
          yearDefaultsPending
            ? (programData.programs[0]?.programCode ?? "")
            : "",
        );
        setYearDefaultsPending(false);
        setProgramsStatus("ready");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setProgramOptions([]);
          setProgramsStatus("error");
          setError(
            requestError.message || "Program options could not be loaded.",
          );
          setStatus("error");
        }
      }
    }

    loadProgramOptions();

    return () => abortController.abort();
  }, [facultyCode, yearDefaultsRequest]);

  const connectedStudents = useMemo(
    () =>
      students.filter((student) => student.walletEligibility === "verified"),
    [students],
  );

  const notConnectedStudents = useMemo(
    () =>
      students.filter((student) => student.walletEligibility !== "verified"),
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
    () =>
      students.filter((student) => selectedIds.includes(student.studentNumber)),
    [selectedIds, students],
  );

  const selectedCreateStudents = useMemo(
    () =>
      selectedStudents.filter(
        (student) =>
          student.walletEligibility === "verified" &&
          student.credentialStatus !== "issued",
      ),
    [selectedStudents],
  );

  const selectedRevokeStudents = useMemo(
    () =>
      selectedStudents.filter(
        (student) =>
          student.walletEligibility === "verified" &&
          student.credentialStatus === "issued" &&
          revokeSelectionIds.includes(student.studentNumber),
      ),
    [revokeSelectionIds, selectedStudents],
  );

  const selectableVisibleStudents = filteredStudents.filter(
    (student) =>
      student.walletEligibility === "verified" &&
      student.credentialStatus !== "issued",
  );

  const allVisibleSelected =
    selectableVisibleStudents.length > 0 &&
    selectableVisibleStudents.every((student) =>
      selectedIds.includes(student.studentNumber),
    );

  const clearResults = () => {
    setStudents([]);
    setSelectedIds([]);
    setWalletFilter("all");
    setStatus("idle");
    setError("");
    setIssuanceStatus("idle");
    setIssuanceSummary(null);
    setRevokeSelectionIds([]);
  };

  const handleGraduationYearChange = (event) => {
    setGraduationYear(event.target.value);
    setYearDefaultsPending(Boolean(event.target.value));
    if (event.target.value) {
      setYearDefaultsRequest((request) => request + 1);
    }
    setFacultyCode(facultyOptions[0]?.code ?? "");
    setProgramCode("");
    setProgramOptions([]);
    setProgramsStatus("idle");
    clearResults();
  };

  const handleFacultyChange = (event) => {
    setYearDefaultsPending(false);
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

    setIssuanceStatus("idle");
    setIssuanceSummary(null);

    if (!graduationYear || !facultyCode || !programCode) {
      setError("Select a graduation year, faculty, and program.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const studentData = await getGraduatingStudents({
        graduationYear: parseInt(graduationYear, 10),
        facultyCode,
        programCode,
      });

      const graduatingStudents = studentData?.students || [];

      if (graduatingStudents.length === 0) {
        setStudents([]);
        setSelectedIds([]);
        setStatus("empty");
        return;
      }

      const [eligibilityData, issuedCredentialData] = await Promise.all([
        resolveWalletEligibility(
          graduatingStudents.map((student) => student.studentNumber),
        ),
        getIssuedCredentials({
          page: 1,
          pageSize: 100,
        }),
      ]);
      const eligibilityByStudent = new Map(
        (eligibilityData?.results ?? []).map((result) => [
          result.studentNumber,
          result.status,
        ]),
      );
      const issuedCredentialByStudent = new Map(
        (issuedCredentialData?.credentials ?? []).map((credential) => [
          credential.studentNumber,
          credential,
        ]),
      );

      setStudents(
        graduatingStudents.map((student) => ({
          ...student,
          walletEligibility:
            eligibilityByStudent.get(student.studentNumber) ??
            student.walletEligibility ??
            "not_verified",
          credentialStatus:
            issuedCredentialByStudent.get(student.studentNumber)?.status ||
            student.credentialStatus ||
            "not_issued",
          credentialId:
            issuedCredentialByStudent.get(student.studentNumber)
              ?.credentialId ?? null,
        })),
      );
      setSelectedIds([]);
      setWalletFilter("all");
      setStatus("ready");
    } catch (requestError) {
      setStudents([]);
      setSelectedIds([]);
      setError(
        requestError.message || "Graduating students could not be loaded.",
      );
      setStatus("error");
    }
  };

  const handleStudentToggle = (student) => {
    if (
      issuanceStatus === "loading" ||
      student.walletEligibility !== "verified"
    ) {
      return;
    }

    if (student.credentialStatus === "issued") {
      const isSelected = selectedIds.includes(student.studentNumber);
      setSelectedIds((current) =>
        isSelected
          ? current.filter((id) => id !== student.studentNumber)
          : [...current, student.studentNumber],
      );
      setRevokeSelectionIds((current) =>
        isSelected
          ? current.filter((id) => id !== student.studentNumber)
          : [...current, student.studentNumber],
      );
    } else {
      const isSelected = selectedIds.includes(student.studentNumber);
      setSelectedIds((current) => {
        if (isSelected) {
          return current.filter((id) => id !== student.studentNumber);
        }

        return [...current, student.studentNumber];
      });
    }
    setIssuanceSummary(null);
  };

  const handleCredentialActionChange = (student, action) => {
    if (student.walletEligibility !== "verified") {
      return;
    }

    if (action === "revoke") {
      setRevokeSelectionIds((current) =>
        current.includes(student.studentNumber)
          ? current
          : [...current, student.studentNumber],
      );
      setSelectedIds((current) =>
        current.includes(student.studentNumber)
          ? current
          : [...current, student.studentNumber],
      );
      return;
    }

    setRevokeSelectionIds((current) =>
      current.filter((id) => id !== student.studentNumber),
    );
    setSelectedIds((current) =>
      current.filter((id) => id !== student.studentNumber),
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filteredStudents
          .filter(
            (student) =>
              student.walletEligibility === "verified" &&
              student.credentialStatus !== "issued",
          )
          .map((student) => student.studentNumber),
      ]),
    ]);
    setIssuanceSummary(null);
  };

  const handleBatchAction = async () => {
    if (
      (selectedCreateStudents.length === 0 &&
        selectedRevokeStudents.length === 0) ||
      issuanceStatus === "loading"
    ) {
      return;
    }

    setIssuanceStatus("loading");
    setIssuanceSummary(null);

    const createResults = await Promise.all(
      selectedCreateStudents.map(async (student) => {
        try {
          const credential = await createAcademicTranscriptVc(
            student.studentNumber,
          );
          return { student, credential, success: true, kind: "create" };
        } catch (requestError) {
          return {
            student,
            success: false,
            kind: "create",
            message: requestError.message || "The VC could not be created.",
          };
        }
      }),
    );

    const revokeResults = await Promise.all(
      selectedRevokeStudents.map(async (student) => {
        try {
          await revokeCredential(student.credentialId);
          return { student, success: true, kind: "revoke" };
        } catch (requestError) {
          return {
            student,
            success: false,
            kind: "revoke",
            message:
              requestError.message || "The credential could not be revoked.",
          };
        }
      }),
    );

    const results = [...createResults, ...revokeResults];
    const failures = results.filter((result) => !result.success);
    const createdCount = createResults.filter(
      (result) => result.success,
    ).length;
    const revokedCount = revokeResults.filter(
      (result) => result.success,
    ).length;

    setIssuanceSummary({
      created: createdCount,
      revoked: revokedCount,
      failures,
    });
    setStudents((current) =>
      current.map((currentStudent) => {
        const created = createResults.find(
          (result) =>
            result.student.studentNumber === currentStudent.studentNumber &&
            result.success,
        );
        const revoked = revokeResults.some(
          (result) =>
            result.student.studentNumber === currentStudent.studentNumber &&
            result.success,
        );

        if (created) {
          return {
            ...currentStudent,
            credentialStatus: created.credential.status || "pending",
            credentialId: created.credential.credentialId ?? null,
          };
        }

        return revoked
          ? {
              ...currentStudent,
              credentialStatus: "revoked",
              credentialId: null,
            }
          : currentStudent;
      }),
    );
    setSelectedIds([]);
    setRevokeSelectionIds([]);
    setIssuanceStatus(failures.length > 0 ? "partial" : "success");

    if (createdCount > 0 || revokedCount > 0) {
      addNotification({
        type: "batch-completed",
        title: "Batch credential actions completed",
        message: `${createdCount} VC${createdCount === 1 ? "" : "s"} created and ${revokedCount} revoked.`,
        actionPage: "issue-transcript",
      });
    }
  };

  return (
    <div className="batch-page">
      <section className="batch-sample-notice" role="note">
        <strong>Issuer database connected</strong>
        <span>
          Graduation results and wallet eligibility are loaded from NestJS.
        </span>
      </section>

      <section className="batch-card">
        <div className="batch-card-heading">
          <div className="batch-heading-icon">
            <Wallet size={20} />
          </div>
          <div>
            <h2>Find Graduating Students</h2>
            <p>Select graduation date, faculty, and program.</p>
          </div>
        </div>

        <form className="batch-filter-form" onSubmit={handleFindStudents}>
          <div className="batch-form-field">
            <label htmlFor="graduation-year">Graduation Year</label>
            <select
              id="graduation-year"
              value={graduationYear}
              onChange={handleGraduationYearChange}
            >
              <option value="">Select Year</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + 2 - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
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
                <option key={program.programCode} value={program.programCode}>
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
        <BatchState
          title="Loading students…"
          message="Loading batch results."
        />
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
          message="Choose a graduation year, faculty, and program to load students."
        />
      )}

      {status === "ready" && (
        <>
          <section className="batch-card batch-students-card">
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
                  disabled={
                    filteredStudents.length === 0 ||
                    allVisibleSelected ||
                    issuanceStatus === "loading"
                  }
                >
                  Select All Results
                </button>
                <button
                  type="button"
                  className="batch-clear-button"
                  onClick={() => {
                    setSelectedIds([]);
                    setRevokeSelectionIds([]);
                    setIssuanceSummary(null);
                  }}
                  disabled={
                    selectedIds.length === 0 || issuanceStatus === "loading"
                  }
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
                    <th>Class</th>
                    <th>Wallet Eligibility</th>
                    <th>Credential Status</th>
                    <th>Credential Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const verified = student.walletEligibility === "verified";
                    const selected = selectedIds.includes(
                      student.studentNumber,
                    );

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
                            disabled={
                              issuanceStatus === "loading" ||
                              student.walletEligibility !== "verified" ||
                              (student.credentialStatus === "issued" &&
                                !revokeSelectionIds.includes(
                                  student.studentNumber,
                                ))
                            }
                            onChange={() => handleStudentToggle(student)}
                          />
                        </td>
                        <td className="batch-student-id">
                          {student.studentNumber}
                        </td>
                        <td>
                          <strong>{student.fullName}</strong>
                        </td>
                        <td>{student.major}</td>
                        <td>{student.graduationClass || "Not recorded"}</td>
                        <td>
                          <WalletStatus status={student.credentialStatus} />
                        </td>
                        <td>
                          <span className="batch-result-unavailable">
                            {getPreparationStatus(student)}
                          </span>
                        </td>
                        <td>
                          {student.credentialStatus === "issued" && (
                            <select
                              className="batch-credential-action"
                              value={
                                revokeSelectionIds.includes(
                                  student.studentNumber,
                                )
                                  ? "revoke"
                                  : ""
                              }
                              disabled={issuanceStatus === "loading"}
                              onChange={(event) =>
                                handleCredentialActionChange(
                                  student,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Actions</option>
                              <option value="revoke">Revoke credential</option>
                            </select>
                          )}
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
              <div className="batch-action-buttons">
                {(selectedCreateStudents.length > 0 ||
                  selectedRevokeStudents.length > 0) && (
                  <button
                    type="button"
                    className={
                      selectedRevokeStudents.length > 0
                        ? "batch-revoke-button"
                        : "batch-issue-button"
                    }
                    disabled={issuanceStatus === "loading"}
                    onClick={handleBatchAction}
                  >
                    {selectedRevokeStudents.length > 0 &&
                      `Revoke ${selectedRevokeStudents.length} VC${selectedRevokeStudents.length === 1 ? "" : "s"}`}
                    {selectedRevokeStudents.length > 0 &&
                      selectedCreateStudents.length > 0 &&
                      " and "}
                    {selectedCreateStudents.length > 0 &&
                      `Create VC${selectedCreateStudents.length === 1 ? "" : "s"} for ${selectedCreateStudents.length} selected`}
                    {issuanceStatus === "loading" && "…"}
                  </button>
                )}
              </div>
            </div>

            {issuanceSummary && (
              <div
                className={`batch-issuance-result ${
                  issuanceSummary.failures.length > 0
                    ? "batch-issuance-result-partial"
                    : ""
                }`}
                role={issuanceSummary.failures.length > 0 ? "alert" : "status"}
              >
                <strong>
                  {issuanceSummary.created} VC
                  {issuanceSummary.created === 1 ? "" : "s"} created.
                </strong>
                {issuanceSummary.revoked > 0 && (
                  <span>
                    {issuanceSummary.revoked} VC
                    {issuanceSummary.revoked === 1 ? "" : "s"} revoked.
                  </span>
                )}
                {issuanceSummary.failures.length > 0 && (
                  <span>
                    {issuanceSummary.failures.length} failed:{" "}
                    {issuanceSummary.failures
                      .map((failure) => failure.student.studentNumber)
                      .join(", ")}
                  </span>
                )}
              </div>
            )}
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
  if (student.credentialStatus === "issued") {
    return "Already issued";
  }

  if (student.credentialStatus === "revoked") {
    return "Credential revoked";
  }

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

  return candidateStatusKnown
    ? "Academic review required"
    : "Open review required";
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
  if (status === "issued") {
    return (
      <span className="wallet-status wallet-status-issued">
        <CheckCircle2 size={13} /> Issued
      </span>
    );
  }

  if (status === "revoked") {
    return (
      <span className="wallet-status wallet-status-revoked">
        <XCircle size={13} /> Revoked
      </span>
    );
  }

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

export default BatchTranscript;
