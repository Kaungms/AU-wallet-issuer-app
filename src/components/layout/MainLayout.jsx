import Header from "./Header";
import Sidebar from "./Sidebar";
import "./layout.css";

function MainLayout({
  activePage,
  onPageChange,
  title,
  description,
  children,
}) {
  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onPageChange={onPageChange} />

      <main className="main-area">
        <Header title={title} description={description} />

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default MainLayout;
