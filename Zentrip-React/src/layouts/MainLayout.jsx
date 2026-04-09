import { Outlet } from "react-router-dom";
import Navbar from "../components/shared/layout/Navbar";
import Footer from "../components/shared/layout/Footer";
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-40 px-4 pt-4">
        <Navbar />
      </div>
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
