"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/contexts/AuthContext";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailSchema = z.object({
  email: z.string().min(1, "Required").email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "Required")
    .refine((v) => /^\d{6}$/.test(v.replace(/\s/g, "")), "Enter the 6-digit code"),
});

export default function Login() {
  const router = useRouter();
  const { updateUser } = useAuthUser();
  const { request: apiRequest, loading } = useAxios();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm({
    mode: "onChange",
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm({
    mode: "onChange",
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const sendOtp = async (data) => {
    try {
      const payload = {
        email: data.email,
        redirectUrl: typeof window !== "undefined" ? window.location.origin : undefined,
      };

      const { data: responseData, error } = await apiRequest({
        method: "POST",
        url: "/admin/send-admin-login-otp",
        payload,
      });

      if (error) throw new Error(typeof error === "string" ? error : error?.message || "Request failed");
      if (responseData?.success) {
        setEmail(data.email.trim().toLowerCase());
        setStep("otp");
        otpForm.reset({ otp: "" });
        showToast("success", responseData.message || "Check your email for the code");
      }
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Could not send code");
    }
  };

  const verifyOtp = async (data) => {
    try {
      const otp = data.otp.replace(/\s/g, "");
      const { data: responseData, error } = await apiRequest({
        method: "POST",
        url: "/admin/admin-verify-login-otp",
        payload: { email, otp },
      });

      if (error) throw new Error(typeof error === "string" ? error : error?.message || "Verification failed");

      if (responseData?.success && responseData?.data?.accessToken) {
        const { accessToken, role, permissions } = responseData.data;
        const session = {
          isAuthenticated: true,
          token: accessToken,
          user: responseData.data,
          role,
          permissions,
        };
        updateUser(session);
        localStorage.setItem("authUser", JSON.stringify(session));
        showToast("success", responseData.message || "Logged in");
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Invalid or expired code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">Admin login</h1>

        {step === "email" && (
          <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Controller
                name="email"
                control={emailForm.control}
                render={({ field }) => <Input {...field} type="email" placeholder="Enter email" autoComplete="email" />}
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send login code"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              Enter the 6-digit code sent to <span className="font-medium text-gray-900">{email}</span>
            </p>
            <div className="space-y-1">
              <Label>Login code</Label>
              <Controller
                name="otp"
                control={otpForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={8}
                    className="text-center text-lg tracking-[0.35em] font-mono"
                    onChange={(e) => field.onChange(e.target.value.replace(/[^\d\s]/g, ""))}
                  />
                )}
              />
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-red-500">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying…" : "Verify and sign in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setStep("email");
                otpForm.reset();
              }}
            >
              Use a different email
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              disabled={loading}
              onClick={() => sendOtp({ email })}
            >
              Resend code
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
