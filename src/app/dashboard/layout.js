"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authUser } = useAuthUser();
  const router = useRouter();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const user = { name: "admin", email: "admin@gmail.com" };

  useEffect(() => {
    // If not logged in, push to root/login
    if (!authUser?.token) {
      router.replace("/");
    }
  }, [authUser, router]);

  // While checking auth, optionally show nothing or a loader
  if (!authUser?.token) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-hidden">
        <Navbar onToggleSidebar={toggleSidebar} />

        {/* 👇 Scrollable wrapper */}
        <main className="flex-1 p-6  bg-gray-50 min-w-0 box-border overflow-y-scroll">
          {/* Overflow wrapper */}
          <div className="w-full overflow-x-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
