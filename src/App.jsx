import { COLORS, FONTS } from "./styles/theme";

function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: COLORS.paper,
        color: COLORS.ink,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "32px",
          textAlign: "center",
          background: COLORS.white,
          border: `1px solid ${COLORS.line}`,
          borderRadius: "16px",
        }}
      >
        <p
          style={{
            ...FONTS.mono,
            margin: "0 0 8px",
            color: COLORS.red,
            fontSize: "12px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          AU Wallet
        </p>

        <h1
          style={{
            ...FONTS.serif,
            margin: "0 0 12px",
            fontSize: "32px",
          }}
        >
          AU Registrar Issuer Portal
        </h1>

        <p
          style={{
            margin: 0,
            color: COLORS.inkSoft,
            lineHeight: 1.6,
          }}
        >
          React project setup completed successfully.
        </p>
      </section>
    </main>
  );
}

export default App;