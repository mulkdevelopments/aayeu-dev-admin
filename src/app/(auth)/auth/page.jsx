"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy magic-link URLs (/auth?type=magic-login&token=...) are no longer used.
 * OTP login happens on the home page.
 */
export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "magic-login") {
      router.replace("/");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-600">
      Redirecting…
    </div>
  );
}
