import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, UserRoundSearch, XCircle } from "lucide-react";

import { getIssuerStudents } from "../../api/issuerApi";
import "./student-data.css";

function StudentData({ onReviewStudent }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const connectedCount = useMemo(
    () => results.filter((student) => student.walletEligibility === "verified").length,
    [results],
  );

  const loadStudents = useCallback(async (searchQuery, page = 1, signal) => {
    setStatus("loading");
    setError("");

    try {
      const studentPage = await fetchStudentPage(
        searchQuery,
        page,
        signal,
      );
      const { students } = studentPage;

      setPagination(studentPage.meta);

      if (students.length === 0) {
        setResults([]);
        setStatus("empty");
        return;
      }

      setResults(students);
      setStatus("ready");
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setResults([]);
        setError(requestError.message || "Student data could not be loaded.");
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadInitialStudents() {
      try {
        const studentPage = await fetchStudentPage(
          "",
          1,
          abortController.signal,
        );
        const { students } = studentPage;

        setResults(students);
        setPagination(studentPage.meta);
        setStatus(students.length > 0 ? "ready" : "empty");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setResults([]);
          setError(requestError.message || "Student data could not be loaded.");
          setStatus("error");
        }
      }
    }

    loadInitialStudents();

    return () => abortController.abort();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (normalizedQuery && normalizedQuery.length < 2) {
      setResults([]);
      setStatus("error");
      setError("Enter at least two characters to search.");
      return;
    }

    setActiveQuery(normalizedQuery);
    await loadStudents(normalizedQuery, 1);
  };

  return (
    <div className="student-data-page">
      <div className="student-data-heading">
        <div>
          <p className="student-data-eyebrow">Pre-issuance review</p>
          <h1>Student Data</h1>
          <p>
            Find an AU student and open the academic review flow before
            transcript credential issuance.
          </p>
        </div>
      </div>

      <section className="student-data-card">
        <div className="student-data-card-heading">
          <UserRoundSearch size={20} />
          <div>
            <h2>Find Student</h2>
            <p>Search by student number, first name, or last name.</p>
          </div>
        </div>

        <form className="student-data-search" onSubmit={handleSearch}>
          <label htmlFor="student-data-query">Student search</label>
          <div>
            <input
              id="student-data-query"
              type="search"
              value={query}
              placeholder="Try 6499002 or Kawin"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" disabled={status === "loading"}>
              <Search size={16} />
              Search
            </button>
          </div>
        </form>

        {status === "loading" && (
          <StudentDataState status="loading" message="Loading students…" />
        )}

        {status === "empty" && (
          <StudentDataState
            status="empty"
            message="No students match this search."
          />
        )}

        {status === "error" && (
          <StudentDataState status="error" message={error} />
        )}

        {status === "ready" && (
          <div className="student-data-results">
            <div className="student-data-summary">
              <span>
                {pagination.total} student{pagination.total !== 1 ? "s" : ""}
              </span>
              <span>{connectedCount} wallet verified on this page</span>
            </div>

            <div className="student-data-table-wrapper">
              <table className="student-data-table">
                <thead>
                  <tr>
                    <th>Student number</th>
                    <th>Student</th>
                    <th>Degree and major</th>
                    <th>Academic status</th>
                    <th>Graduation</th>
                    <th>Wallet eligibility</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((student) => (
                    <tr key={student.studentNumber}>
                      <td className="student-data-id">{student.studentNumber}</td>
                      <td>{student.fullName}</td>
                      <td>
                        <strong>{formatProgram(student)}</strong>
                        {student.majorConcentration && (
                          <span className="student-data-secondary-value">
                            Concentration: {student.majorConcentration}
                          </span>
                        )}
                      </td>
                      <td>{formatStatus(student.academicStatus)}</td>
                      <td>{formatDate(student.graduationDate)}</td>
                      <td>
                        <WalletEligibility status={student.walletEligibility} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="student-data-review-button"
                          onClick={() => onReviewStudent?.(student.studentNumber)}
                        >
                          Review academic record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <nav className="student-data-pagination" aria-label="Student pages">
                <button
                  type="button"
                  disabled={status === "loading" || pagination.page <= 1}
                  onClick={() => loadStudents(activeQuery, pagination.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={
                    status === "loading" ||
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() => loadStudents(activeQuery, pagination.page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

async function fetchStudentPage(searchQuery, page, signal) {
  const studentData = await getIssuerStudents({
    q: searchQuery,
    page,
    pageSize: 25,
    signal,
  });
  const students = studentData.students.map((student) => ({
    ...student,
    walletEligibility: student.walletEligibility ?? "not_verified",
  }));

  return {
    students,
    meta: normalizePagination(studentData.meta, page, 25, students.length),
  };
}

function normalizePagination(meta, page, pageSize, resultCount) {
  return {
    page: Number.isInteger(meta?.page) ? meta.page : page,
    pageSize: Number.isInteger(meta?.pageSize) ? meta.pageSize : pageSize,
    total: Number.isInteger(meta?.total) ? meta.total : resultCount,
    totalPages: Number.isInteger(meta?.totalPages)
      ? Math.max(meta.totalPages, 1)
      : 1,
  };
}

function formatProgram(student) {
  const degree = student.degreeName?.trim();
  const major = student.major?.trim();

  if (degree && major) {
    return `${degree} — ${major}`;
  }

  return degree || major || "Not recorded";
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
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function WalletEligibility({ status }) {
  return status === "verified" ? (
    <span className="student-wallet-status student-wallet-status-verified">
      <CheckCircle2 size={13} /> Verified
    </span>
  ) : (
    <span className="student-wallet-status student-wallet-status-unverified">
      <XCircle size={13} /> Not verified
    </span>
  );
}

function StudentDataState({ status, message }) {
  return (
    <div
      className={`student-data-state student-data-state-${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

export default StudentData;
