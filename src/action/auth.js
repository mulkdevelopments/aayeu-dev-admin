"use server";

import axiosInstance from "@/utils/axiosInstance";
import { z } from "zod";

// Define schema using Zod.
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// global error handler
const handleApiError = (error) => {
  console.error("Login error:", error.response?.data || error.message);
  return {
    status: error.response?.data?.status || 500,
    error:
      error.response?.data?.message ||
      "Something went wrong. Please try again later.",
  };
};

export async function loginAction(prevState, formData) {
  try {
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const result = loginSchema.safeParse(payload);
    if (!result.success) {
      return { error: "Invalid email or password format." };
    }

    const response = await axiosInstance.post("/admin/admin-login", payload);

    if (response.data.status === 200) {
      return response.data;
    }
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
