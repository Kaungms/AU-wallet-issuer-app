import { useCallback, useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";

import { getIssuedCredentials } from "../../api/issuerApi";
import "./issued-credentials.css";

function IssuedCredentials() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [credentials, setCredentials] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });

  const loadCredentials = useCallback(async (searchQuery, page = 1, signal) => {
    setStatus("loading");
    setError("");

    try {
      const result = await getIssuedCredentials({
        q: searchQuery,
        page,
        pageSize: 25,
        signal,
      });
      const meta = result.meta ?? {};

      setCredentials(result.credentials);
      setPagination({
        page: Number.isInteger(meta.page) ? meta.page : page,
        pageSize: Number.isInteger(meta.pageSize) ? meta.pageSize : 25,
        total: Number.isInteger(meta.total) ? meta.total : result.credentials.length,
        totalPages: Number.isInteger(meta.totalPages)
          ? Math.max(meta.totalPages, 1)
          : 1,
      });
      setStatus(result.credentials.length ? "ready" : "empty");
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setCredentials([]);
        setError(requestError.message || "Issued credentials could not be loaded.");
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadInitialCredentials() {
      await loadCredentials("", 1, abortController.signal);
    }

    loadInitialCredentials();
    return () => abortController.abort();
  }, [loadCredentials]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim();

    if (normalizedQuery && normalizedQuery.length < 2) {
      setStatus("error");
      setError("Enter at least two characters to search.");
      return;
    }

    setActiveQuery(normalizedQuery);
    await loadCredentials(normalizedQuery);
  };

  return (
    <div className="issued-page">
      <header className="issued-summary">
        <div>
          <p className="issued-eyebrow">Registrar record</p>
          <h1>Issued Credentials</h1>
          <p>Completed academic transcript credentials issued to wallet holders.</p>
        </div>
        <div className="issued-total">
          <div className="issued-total-icon"><FileText size={20} /></div>
          <div><span>Total issued</span><strong>{pagination.total}</strong></div>
        </div>
      </header>

      <section className="issued-card">
        <form className="issued-toolbar" onSubmit={handleSearch}>
          <label className="issued-search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              placeholder="Search credential or student ID..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </form>

        <div className="issued-table-wrapper">
          <table className="issued-table">
            <thead>
              <tr>
                <th>Credential ID</th><th>Student ID</th><th>Major</th>
                <th>Credential</th><th>Issued at</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" && <TableMessage>Loading issued credentials…</TableMessage>}
              {status === "error" && <TableMessage role="alert">{error}</TableMessage>}
              {status === "empty" && <TableMessage>No issued credentials found.</TableMessage>}
              {status === "ready" && credentials.map((credential) => (
                <tr key={credential.credentialId}>
                  <td className="credential-id">{credential.credentialId}</td>
                  <td>{credential.studentNumber}</td>
                  <td>{credential.major || "Not recorded"}</td>
                  <td>Official Academic Transcript</td>
                  <td className="issued-date">{formatIssuedAt(credential.issuedAt)}</td>
                  <td><span className="issued-status">Issued</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <footer className="issued-table-footer">
            <button type="button" disabled={status === "loading" || pagination.page <= 1} onClick={() => loadCredentials(activeQuery, pagination.page - 1)}>Previous</button>
            <span> Page {pagination.page} of {pagination.totalPages} </span>
            <button type="button" disabled={status === "loading" || pagination.page >= pagination.totalPages} onClick={() => loadCredentials(activeQuery, pagination.page + 1)}>Next</button>
          </footer>
        )}
      </section>
    </div>
  );
}

function TableMessage({ children, ...props }) {
  return <tr><td className="issued-empty" colSpan="6" {...props}>{children}</td></tr>;
}

function formatIssuedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default IssuedCredentials;
