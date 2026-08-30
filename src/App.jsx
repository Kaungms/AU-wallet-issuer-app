import { useEffect, useState } from "react";

import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./pages/dashboard/Dashboard";
import IssueTranscript from "./pages/issue-transcript/IssueTranscript";
import StudentData from "./pages/student-data/StudentData";
import Settings from "./pages/settings/Settings";
import Notifications from "./pages/notifications/Notifications";
import IssuedCredentials from "./pages/issued-credentials/IssuedCredentials";

const pageInformation = {
  dashboard: {
    title: "Dashboard",
    description:
      "Monitor verified wallet connections and automatic verification activity.",
  },

  students: {
    title: "Student Data",
    description:
      "Find students and prepare academic records for review.",
  },

  "issue-transcript": {
    title: "Issue Transcript",
    description:
      "Review academic records and prepare a pre-issuance selection.",
  },

  "issued-credentials": {
    title: "Issued Credentials",
    description:
      "Review digital transcript credentials issued by the AU Registrar.",
  },

  notifications: {
    title: "Notifications",
    description:
      "Review issuer activity and system notifications.",
  },

  settings: {
    title: "Settings",
    description:
      "Manage issuer portal configuration.",
  },
};

function App() {
  const [initialNavigation] = useState(readNavigationFromUrl);

  const [activePage, setActivePage] = useState(
    initialNavigation.page,
  );

  const [issueMode, setIssueMode] = useState(
    initialNavigation.mode,
  );

  const [reviewStudentId, setReviewStudentId] = useState(
    initialNavigation.studentId,
  );

  useEffect(() => {
    const syncNavigationFromUrl = () => {
      const navigation = readNavigationFromUrl();

      setActivePage(navigation.page);
      setIssueMode(navigation.mode);
      setReviewStudentId(navigation.studentId);
    };

    if (!window.location.hash) {
      window.history.replaceState(
        null,
        "",
        buildNavigationHash({
          page: initialNavigation.page,
          mode: initialNavigation.mode,
          studentId: initialNavigation.studentId,
        }),
      );
    }

    window.addEventListener(
      "popstate",
      syncNavigationFromUrl,
    );

    return () =>
      window.removeEventListener(
        "popstate",
        syncNavigationFromUrl,
      );
  }, [initialNavigation]);

  const handlePageChange = (
    page,
    mode = null,
    studentId = "",
  ) => {
    const nextMode =
      page === "issue-transcript"
        ? mode ?? issueMode
        : issueMode;

    const nextStudentId =
      page === "issue-transcript"
        ? studentId
        : "";

    setIssueMode(nextMode);
    setReviewStudentId(nextStudentId);
    setActivePage(page);

    const nextHash = buildNavigationHash({
      page,
      mode: nextMode,
      studentId: nextStudentId,
    });

    if (window.location.hash !== nextHash) {
      window.history.pushState(
        null,
        "",
        nextHash,
      );
    }
  };

  const currentPage =
    pageInformation[activePage] ||
    pageInformation.dashboard;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            onPageChange={handlePageChange}
          />
        );

      case "students":
        return (
          <StudentData
            onReviewStudent={(studentId) =>
              handlePageChange(
                "issue-transcript",
                "single",
                studentId,
              )
            }
          />
        );

      case "issue-transcript":
        return (
          <IssueTranscript
            key={`${issueMode}:${reviewStudentId}`}
            initialMode={issueMode}
            initialStudentId={reviewStudentId}
            onModeChange={(mode) =>
              handlePageChange(
                "issue-transcript",
                mode,
              )
            }
            onStudentChange={(studentId) =>
              handlePageChange(
                "issue-transcript",
                "single",
                studentId,
              )
            }
          />
        );

      case "issued-credentials":
        return <IssuedCredentials />;

      case "notifications":
        return (
          <Notifications
            onPageChange={handlePageChange}
          />
        );

      case "settings":
        return (
          <Settings
            onPageChange={handlePageChange}
          />
        );

      default:
        return (
          <Dashboard
            onPageChange={handlePageChange}
          />
        );
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

function readNavigationFromUrl() {
  const hashValue =
    window.location.hash.replace(/^#\/?/, "");

  const [routeValue = "", queryValue = ""] =
    hashValue.split("?");

  const page = Object.hasOwn(
    pageInformation,
    routeValue,
  )
    ? routeValue
    : "dashboard";

  const query =
    new URLSearchParams(queryValue);

  const mode =
    query.get("mode") === "batch"
      ? "batch"
      : "single";

  const studentId =
    page === "issue-transcript"
      ? query.get("student")?.trim() ?? ""
      : "";

  return {
    page,
    mode,
    studentId,
  };
}

function buildNavigationHash({
  page,
  mode,
  studentId,
}) {
  if (page !== "issue-transcript") {
    return `#/${page}`;
  }

  const query =
    new URLSearchParams({ mode });

  if (studentId) {
    query.set("student", studentId);
  }

  return `#/issue-transcript?${query.toString()}`;
}

export default App;