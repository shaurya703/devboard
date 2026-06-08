import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

/** Chrome for authenticated pages. */
export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
