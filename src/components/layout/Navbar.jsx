"use client";

import { Menu, Bell, Key, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ROUTE_PATH from "@/libs/route-path";
import { useLogout } from "@/hooks/useLogout";

const user = {
  name: "Super Admin",
  email: "superadmin@gmail.com",
};

export default function Navbar({ onToggleSidebar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { handleLogout } = useLogout();

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // ✅ Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full relative px-3 sm:px-4">
      <nav className="h-16 w-full border-b border-gray-200 bg-white 
                      shadow-md flex items-center justify-between rounded-lg px-4 relative">

        {/* Mobile Hamburger */}
        {/* <button className="md:hidden text-[#C38E1E]"  onClick={onToggleSidebar}>
          <Menu size={24} />
        </button> */}
         <button 
  className="block sm:hidden text-[#C38E1E]"  
  onClick={onToggleSidebar}
>
  <Menu size={24} />
</button>

        {/* Title */}
        <div className="font-bold text-2xl text-gray-900 truncate">Aayeu</div>

        {/* Right section */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0 relative">
          {/* <Bell className="h-5 w-5 text-black cursor-pointer" /> */}

          {/* Profile */}
          <div
            className="hidden sm:flex items-center cursor-pointer"
            onClick={toggleDropdown}
          >
            <div className="w-8 h-8 bg-[#C38E1E] text-white flex items-center justify-center rounded-full shadow-sm">
              {user.name[0].toUpperCase()}
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-black">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 flex flex-col gap-2"
            >
              <Button
                className="w-full justify-start bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={() => {
                  toast.success("Profile clicked");
                  setIsDropdownOpen(false);
                  router.push(ROUTE_PATH.DASHBOARD.ADMIN_PROFILE);
                }}
              >
                <User /> Profile
              </Button>

              <Button
                className="w-full justify-start bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={() => {
                  toast.success("Reset Password clicked");
                  setIsDropdownOpen(false);
                  router.push(ROUTE_PATH.AUTH.RESET_PASSWORD);
                }}
              >
                <Key size={16} className="mr-2" />
                Reset Password
              </Button>

              <Button
                className="w-full justify-start  bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={() => {
                  toast.success("Change Password clicked");
                  setIsDropdownOpen(false);
                  router.push(ROUTE_PATH.AUTH.CHANGE_PASSWORD);
                }}
              >
                <Key size={16} className="mr-2" />
                Change Password
              </Button>

              <Button
                className="w-full justify-start bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={() => {
                  toast.success("Forget Password clicked");
                  setIsDropdownOpen(false);
                  router.push(ROUTE_PATH.AUTH.FORGOT_PASSWORD);
                }}
              >
                Forget Password
              </Button>

              <Button
                className="w-full justify-start bg-red-500 text-white hover:bg-red-800"
                onClick={() => {
                  toast.success("Logged out successfully");
                  handleLogout(); // clears auth + localStorage and redirects
                  setIsDropdownOpen(false);
                }}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
