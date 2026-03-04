"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import socket from "@/utils/socket";
import utilities from "@/utils/utilities";
import useAxios from "@/hooks/useAxios";

const NotificationBell = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();
  const { request } = useAxios();

  // 🔹 Initial unread count fetch karna
  const fetchUnreadNotifications = async () => {
    const { data, error } = await request({
      method: "GET",
      url: "/admin/get-all-notification",
      authRequired: true,
    });

    if (!error) {
      const notifications = data?.data?.notifications || [];
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      setNotificationCount(unreadCount);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();

    // Jab naye notification aaye
    socket.on("new_message", (data) => {
      let id = utilities.localStorage.getUserIdFromLocalStorage();

      if (data?.adminId === id) {
        setNotificationCount((prev) => prev + 1);
      }
    });

    // Disconnect hone par
    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    return () => {
      socket.off("new_message");
      socket.off("disconnect");
    };
  }, []);

  const handleClick = () => {
    router.push("/dashboard/inbox");
    setNotificationCount(0); // ✅ Inbox open karte hi count reset
  };

  return (
    <button
    className="relative p-2 rounded-full hover:bg-accent transition focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Notifications"
          title="Notifications"
    onClick={handleClick}>
      <Bell className="w-6 h-6 cursor-pointer text-muted-foreground" />
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[2rem] h-[1.25rem] px-1 text-xs font-semibold text-white bg-red-500 rounded-full flex items-center justify-center">
          {" "}
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
