import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, UserRoundSearch, XCircle } from "lucide-react";

import { getAllIssuerStudents } from "../../api/studentDirectory";
import "./student-data.css";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "issued", label: "Issued" },
  { value: "not_verified", label: "Not verified" },
];

function StudentData({ onReviewStudent }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const filteredResults = results.filter(
    (student) =>
      statusFilter === "all" ||
      getCredentialStatus(student.credentialStatus) === statusFilter,
  );

  const pagination = {
    page,
    total: filteredResults.length,
    totalPages: Math.max(1, Math.ceil(filteredResults.length / 25)),
  };
  const visibleResults = filteredResults.slice((page - 1) * 25, page * 25);
  const connectedCount = useMemo(
    () => results.filter((student) =>
      ["verified", "issued"].includes(student.credentialStatus),
    ).length,
    [results],
  );

  const loadStudents = useCallback(async (searchQuery, signal) => {
    setStatus("loading");
    setError("");

    try {
      const students = await getAllIssuerStudents({ q: searchQuery, signal });
      setPage(1);

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
        const students = await getAllIssuerStudents({
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        setResults(students);
        setPage(1);
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

    await loadStudents(normalizedQuery);
  };

  return (
    <div className="student-data-page">


      <section className="student-data-card">
        <div className="student-data-card-heading">
          <UserRoundSearch size={20} />
          <div>
            <h2>Find Student</h2>
            <p>Search by student ID (AU ID), first name, or last name.</p>
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
              <span>{connectedCount} wallet connected in search results</span>
            </div>

            <div className="student-data-status-filters">
              <span id="student-status-filter-label">Status</span>
              <div role="group" aria-labelledby="student-status-filter-label">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setPage(1);
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <span role="status">
                {filteredResults.length} of {results.length} students match
              </span>
            </div>

            <div className="student-data-table-wrapper">
              <table className="student-data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Gender</th>
                    <th>Faculty</th>
                    <th>Degree</th>
                    <th>Major</th>
                    <th>Graduate Class</th>
                    <th>Graduation</th>
                    <th>Status</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={11}>
                        No students match this status. Choose another status or search.
                      </td>
                    </tr>
                  )}
                  {visibleResults.map((student) => (
                    <tr key={student.studentNumber}>
                      <td className="student-data-id">{student.studentNumber}</td>
                      <td>{student.firstName || "Not recorded"}</td>
                      <td>{student.lastName || "Not recorded"}</td>
                      <td>{student.gender || "Not recorded"}</td>
                      <td>{student.facultyName || "Not recorded"}</td>
                      <td>{student.degreeName || "Not recorded"}</td>
                      <td>{student.major || "Not recorded"}</td>
                      <td>{student.graduationClass || "Not recorded"}</td>
                      <td>{formatDate(student.graduationDate)}</td>
                      <td>
                        <CredentialStatus status={student.credentialStatus} />
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
                  onClick={() => setPage(page - 1)}
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
                  onClick={() => setPage(page + 1)}
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

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCredentialStatus(status) {
  return ["verified", "issued"].includes(status) ? status : "not_verified";
}

function CredentialStatus({ status }) {
  if (status === "issued") {
    return (
      <span className="student-wallet-status student-wallet-status-issued">
        <CheckCircle2 size={13} /> Issued
      </span>
    );
  }

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
