"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      {/* Heading */}
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Forgot Password
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
        Enter your email address and we’ll send you a link to reset your password.
      </p>

      {/* Form */}
      <form className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <Input type="email" id="email" name="email" required />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
