import { FileText, Search } from "lucide-react";
import "./issued-credentials.css";

const credentials = [
  {
    id: "VC-2026-00125",
    studentId: "6611001",
    major: "Computer Science",
    credentialType: "Official Academic Transcript",
    issuedAt: "30 Aug 2026, 2:15 PM",
    status: "Issued",
  },
  {
    id: "VC-2026-00124",
    studentId: "6611018",
    major: "Information Technology",
    credentialType: "Official Academic Transcript",
    issuedAt: "30 Aug 2026, 1:42 PM",
    status: "Issued",
  },
  {
    id: "VC-2026-00123",
    studentId: "6512044",
    major: "Marketing",
    credentialType: "Official Academic Transcript",
    issuedAt: "29 Aug 2026, 4:30 PM",
    status: "Issued",
  },
];

function IssuedCredentials() {
  return (
    <div className="issued-credentials-page">
      <div className="issued-credentials-heading">
        <div>
          <p className="issued-label">Credential Records</p>
          <h1>Issued Credentials</h1>
          <p>
            Review all digital transcripts issued by the AU Registrar.
          </p>
        </div>

        <div className="issued-count-card">
          <FileText size={20} />
          <div>
            <span>Total Issued</span>
            <strong>{credentials.length}</strong>
          </div>
        </div>
      </div>

      <section className="issued-credentials-card">
        <div className="issued-toolbar">
          <div className="issued-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search credential or student ID..."
            />
          </div>
        </div>

        <div className="issued-table-wrapper">
          <table className="issued-table">
            <thead>
              <tr>
                <th>Credential ID</th>
                <th>Student ID</th>
                <th>Major</th>
                <th>Credential</th>
                <th>Issued At</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {credentials.map((credential) => (
                <tr key={credential.id}>
                  <td className="credential-id">
                    {credential.id}
                  </td>

                  <td>{credential.studentId}</td>

                  <td>{credential.major}</td>

                  <td>{credential.credentialType}</td>

                  <td>{credential.issuedAt}</td>

                  <td>
                    <span className="issued-status">
                      {credential.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default IssuedCredentials;