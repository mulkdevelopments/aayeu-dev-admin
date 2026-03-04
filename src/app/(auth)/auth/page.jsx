"use client";

import MagicLogin from "@/components/comman/MagicLogin";
import { useSearchParams } from "next/navigation";
import React from "react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  return <div>
    {
        type === "magic-login" && <MagicLogin />
    }
  </div>;
}
