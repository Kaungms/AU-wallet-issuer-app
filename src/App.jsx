import { useState } from "react";
import MainLayout from "./components/layout/MainLayout";
import IssueTranscript from "./pages/issue-transcript/IssueTranscript";

const pageInformation = {
  dashboard: {
    title: "Dashboard",
    description: "Overview of credential issuing activities.",
  },
  students: {
    title: "Student Data",
    description: "Search and review official AU student records.",
  },
  "issue-transcript": {
    title: "Issue Transcript",
    description:
      "Review an official transcript and send a signed credential to the student's wallet.",
  },
  settings: {
    title: "Settings",
    description: "Manage issuer portal configuration.",
  },
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const currentPage = pageInformation[activePage] || pageInformation.dashboard;

  const renderPage = () => {
    switch (activePage) {
      case "students":
        return <p>Student Data page will be added later.</p>;

      case "issue-transcript":
        return <IssueTranscript />;

      case "settings":
        return <p>Settings page will be added later.</p>;

      case "dashboard":
      default:
        return <p>Dashboard page will be added later.</p>;
    }
  };

  return (
    <MainLayout
      activePage={activePage}
      onPageChange={setActivePage}
      title={currentPage.title}
      description={currentPage.description}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
