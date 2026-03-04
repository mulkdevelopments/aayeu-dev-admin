"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const oldPass = data.get("oldPassword");
    const newPass = data.get("newPassword");
    const confirmPass = data.get("confirmPassword");

    if (newPass !== confirmPass) {
      alert("New password and confirm password do not match!");
      return;
    }

    console.log({ oldPass, newPass });
    alert("Password updated successfully!");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Change Password
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Old Password */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Old Password</label>
          <Input
            type={showOld ? "text" : "password"}
            name="oldPassword"
            placeholder="Enter your current password"
            required
          />
          <span
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-9 cursor-pointer text-gray-400"
          >
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>

        {/* New Password */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <Input
            type={showNew ? "text" : "password"}
            name="newPassword"
            placeholder="Enter new password"
            required
            minLength={6}
          />
          <span
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-9 cursor-pointer text-gray-400"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <Input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm new password"
            required
            minLength={6}
          />
          <span
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-9 cursor-pointer text-gray-400"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>

        <Button
          type="submit"
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mt-2"
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}
