import { Outlet } from "react-router-dom";
import Navbar from "../components/shared/layout/Navbar";

export default function HeaderOnlyLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 px-4 pt-4">
        <Navbar />
      </div>
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
