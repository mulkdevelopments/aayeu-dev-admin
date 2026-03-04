"use client";

import ROUTE_PATH from "@/libs/route-path";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress"; // ✅ ShadCN Progress

const AuthContext = createContext();

export const useAuthUser = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [progress, setProgress] = useState(10); // ✅ Start from 10 for smoother effect

  useEffect(() => {
    let storedUser = localStorage.getItem("authUser");

    // ✅ Fast progress update every 100ms
    let interval = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 15 : prev)); // ✅ Faster increment
    }, 100);

    setTimeout(() => {
      if (storedUser) {
        setAuthUser(JSON.parse(storedUser));
      }
      setIsAuthLoaded(true);
      clearInterval(interval);
      setProgress(100);
    }, 800); // ✅ Reduced delay for faster load
  }, []);

  const login = (response) => {
    let { token, role, permissions } = response;
     console.log(token, role, permissions);
    const userData = {
       user: response,
      isAuthenticated: true,
      token,
      role,
      permissions,
    };
    setAuthUser(userData);
    localStorage.setItem("authUser", JSON.stringify(userData));
  };

  const logout = () => {
    console.log("LOGOUT CALLED, clearing authUser");
    setAuthUser(null);
    localStorage.removeItem("authUser");
    router.push(ROUTE_PATH.AUTH.LOGIN);
  };

   const updateUser = (user) => {
    
    setAuthUser((prev) => ({ ...prev, ...user }));

  };

  if (!isAuthLoaded) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-6 px-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200 animate-pulse">
          Please Wait...
        </h2>

        <Progress
  value={progress}
  className="w-full max-w-[300px] md:max-w-[400px] lg:max-w-[500px] h-3 md:h-4 rounded-full bg-yellow-700 transition-all duration-300"
/>

      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authUser, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
