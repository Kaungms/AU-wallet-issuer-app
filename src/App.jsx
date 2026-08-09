import { useState } from "react";

import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./pages/dashboard/Dashboard";
import IssueTranscript from "./pages/issue-transcript/IssueTranscript";

const pageInformation = {
  dashboard: {
    title: "Dashboard",
    description:
      "Monitor student wallet readiness and transcript issuance preparation.",
  },

  students: {
    title: "Student Data",
    description: "Search and review official AU student records.",
  },

  "issue-transcript": {
    title: "Issue Transcript",
    description:
      "Review official academic records and prepare transcript credentials for issuance.",
  },

  settings: {
    title: "Settings",
    description: "Manage issuer portal configuration.",
  },
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [issueMode, setIssueMode] = useState("single"); // New state for issue mode
  const handlePageChange = (page, mode = null) => {
    if (page === "issue-transcript" && mode) {
      setIssueMode(mode);
    }

    setActivePage(page);
  };

  const currentPage = pageInformation[activePage] || pageInformation.dashboard;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onPageChange={handlePageChange} />;

      case "students":
        return <p>Student Data page will be added later.</p>;

      case "issue-transcript":
        return <IssueTranscript initialMode={issueMode} />;

      case "settings":
        return <p>Settings page will be added later.</p>;

      default:
        return <Dashboard onPageChange={handlePageChange} />;
    }
  };

  return (
    <MainLayout
      activePage={activePage}
      onPageChange={handlePageChange}
      title={currentPage.title}
      description={currentPage.description}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
