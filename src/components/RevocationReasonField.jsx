import "./revocation-reason.css";

export default function RevocationReasonField({ id, value, onChange, disabled, batch = false }) {
  return (
    <div className="revocation-reason-field">
      <label htmlFor={id}>Reason for revocation <span aria-hidden="true">*</span></label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
        maxLength={2000}
        rows={3}
        placeholder="Explain why this credential is being revoked…"
        aria-describedby={`${id}-help`}
      />
      <p id={`${id}-help`}>
        {batch ? "This reason applies to every credential selected for revocation. " : ""}
        Review the credential and reason in the confirmation before revoking.
      </p>
    </div>
  );
}
