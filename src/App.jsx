import { useState } from "react";
import MainLayout from "./components/layout/MainLayout";
import { COLORS, FONTS } from "./styles/theme";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <MainLayout activePage={activePage} onPageChange={setActivePage}>
      <div
        style={{
          minHeight: "420px",
          padding: "28px",
          background: COLORS.white,
          border: `1px solid ${COLORS.line}`,
          borderRadius: "12px",
        }}
      >
        <p
          style={{
            ...FONTS.mono,
            margin: "0 0 8px",
            color: COLORS.red,
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Current page
        </p>

        <h3
          style={{
            ...FONTS.serif,
            margin: "0 0 10px",
            color: COLORS.ink,
            fontSize: "26px",
            textTransform: "capitalize",
          }}
        >
          {activePage}
        </h3>

        <p
          style={{
            margin: 0,
            color: COLORS.inkSoft,
            lineHeight: 1.7,
          }}
        >
          The main layout is complete. The content for this page will be added
          in its own feature branch.
        </p>
      </div>
    </MainLayout>
  );
}

export default App;
