import "./layout.css";

function BrowserFrame({ children }) {
  return (
    <div className="browser-frame">
      <div className="browser-topbar">
        <div className="browser-dots">
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="browser-dot" />
        </div>

        <div className="browser-address">
          issuer.au-wallet.assumption.ac.th
        </div>

        <div className="browser-actions">
          <span>−</span>
          <span>□</span>
          <span>×</span>
        </div>
      </div>

      <div className="browser-content">{children}</div>
    </div>
  );
}

export default BrowserFrame;