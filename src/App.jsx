import { useState } from "react";
import MainLayout from "./components/layout/MainLayout";

const pageNames = {
  dashboard: "Dashboard",
  students: "Students",
  "issue-transcript": "Issue Transcript",
  settings: "Settings",
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <MainLayout
      activePage={activePage}
      onPageChange={setActivePage}
    >
      <section className="page-placeholder">
        <h2>{pageNames[activePage]}</h2>

        <p>
          This page will be implemented in its feature branch.
        </p>
      </section>
    </MainLayout>
  );
}

export default App;