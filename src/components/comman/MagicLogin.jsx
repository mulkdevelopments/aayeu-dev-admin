"use client";

import useAxios from "@/hooks/useAxios";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthUser } from "@/contexts/AuthContext";

function MagicLogin() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || null;
  const { updateUser } = useAuthUser();
  const router = useRouter();

  const { request, loading, error } = useAxios();

  const handleMagicLogin = async () => {
    const { data, error } = await request({
      url: "/admin/admin-login-with-magic-link",
      method: "POST",
      payload: { token },
    });

    if (error) {
      console.error("Magic login error:", error);
      toast.success(error || "Magic login failed");
      router.push("/")

    }
    else if (data.status === 200) {
      if (data?.data?.accessToken) {
        // token setting 
        const { accessToken, ...rest } = data.data;
        const prevAuth = JSON.parse(localStorage.getItem("authUser")) || {}
        // updateUser(data.data);
        updateUser({ isAuthenticated: prevAuth.isAuthenticated, token: accessToken, user: data.data });
        localStorage.setItem("authUser", JSON.stringify({ isAuthenticated: prevAuth.isAuthenticated, token: accessToken, user: data.data }));

      }
      toast.success(data.message || "Login successful!");
      router.push("/dashboard");
    } else {
      toast.error(data.message || "Magic login failed");

    }
  };

  const hasCalled = React.useRef(false);

  useEffect(() => {
    if (!hasCalled.current) {
      hasCalled.current = true;
      handleMagicLogin();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? (
        <div className="text-lg">
          <Loader2 className="animate-spin mr-2 inline-block" />
          Logging you in...
        </div>
      ) : error ? (
        <div className="text-lg">
          <XCircle className="text-red-500 mr-2 inline-block" />
          Login failed! Please try again.
        </div>
      ) : (
        <div className="text-lg">
          <CheckCircle2 className="text-green-500 mr-2 inline-block" />
          Login successful! Redirecting...
        </div>
      )}
    </div>
  );
}

export default MagicLogin;
