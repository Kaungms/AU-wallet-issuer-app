import Header from "./Header";
import Sidebar from "./Sidebar";
import "./layout.css";

function MainLayout({ activePage, onPageChange, children }) {
  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onPageChange={onPageChange} />

      <main className="main-area">
        <Header activePage={activePage} />

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}

export default MainLayout;
