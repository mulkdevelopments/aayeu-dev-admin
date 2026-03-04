"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthUser } from "@/contexts/AuthContext";
import ROUTE_PATH from "@/libs/route-path";
const publicRoutes = [ROUTE_PATH.AUTH.LOGIN,ROUTE_PATH.AUTH.FORGOT_PASSWORD]; // Add more public paths if needed
export default function ProtectedRoute({ children }) {
  const { authUser } = useAuthUser();
  
  // null or {user: object, token: string, role: superadmin or admin, permissions: array, isAuthenticated: true or false}

  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname i.e. /, /dashboard, /dashboard/users
  useEffect(() => {
    // Only protect routes not listed as public
    if (!authUser?.isAuthenticated && !publicRoutes.includes(pathname)) {
      router.replace(ROUTE_PATH.AUTH.LOGIN);
    }
  }, [authUser, pathname]);

  if (!authUser?.isAuthenticated && !publicRoutes.includes(pathname)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-gray-600 border-t-white animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium tracking-wide text-gray-200">
              Preparing your secure dashboard
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This will only take a moment…
            </p>
          </div>
        </div>
      </div>
    );
  }
  

  return children; 
}

