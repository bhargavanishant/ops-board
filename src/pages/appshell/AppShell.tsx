import { useState } from "react";
import { Outlet } from "react-router";
import Header from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";
import "./AppShell.css";

const SIDEBAR_WIDTH = "220px";
const SIDEBAR_WIDTH_COLLAPSED = "64px";

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-root">
      <Header />
      <div
        className="app-shell"
        style={{
          "--sidebar-width": collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        } as React.CSSProperties}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="app-shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
