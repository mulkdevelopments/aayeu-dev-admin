"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useState } from "react";
import { useAuthUser } from "@/contexts/AuthContext"; // Import AuthContext

export default function useAxios() {
   const { authUser } = useAuthUser(); // Get token from AuthContext
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Make API requests with better flexibility.
   *
   * @param {object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} options.url - API endpoint
   * @param {object|FormData} [options.payload] - Request payload (optional)
   * @param {boolean} [options.authRequired=false] - Whether to include the token
   * @param {object} [options.headers={}] - Custom headers (optional)
   * @param {object} [options.params={}] - Query parameters (optional)
   *
   * @returns {Promise<{ data: any, error: string | null }>} - API response data or error
   */
  const request = async ({
    method,
    url,
    payload = null,
    authRequired = false,
    responseType = "json",
    headers = {},
    params = {}, // ✅ Added params for GET requests
  }) => {
    setLoading(true);
    setError(null);

    try {
      let requestHeaders = { ...headers };

      // If this request needs auth but user has no token, force logout-style redirect
      if (authRequired && !authUser?.token) {
        // Clear any stale auth info and send user to root/login
        if (typeof window !== "undefined") {
          localStorage.removeItem("authUser");
          window.location.href = "/";
        }
        // Early return so we don't even try the API call
        return { data: null, error: "Unauthorized: missing token" };
      }

      // Handle JSON vs FormData dynamically
      let requestData = payload;
      if (payload instanceof FormData) {
        // Don't set Content-Type for FormData - let axios handle it with boundary
        // Remove default Content-Type header from axios instance
        delete requestHeaders["Content-Type"];
      } else if (typeof payload === "object" && payload !== null) {
        requestHeaders["Content-Type"] = "application/json"; // ✅ Set Content-Type for JSON
      }

      // Attach Authorization token if required
      if (authRequired && authUser?.token) {
        // console.log("token in user is",authUser.token)
        requestHeaders.Authorization = `Bearer ${authUser.token}`;
      }  

      // ✅ Build axios config (GET uses params; others use body when payload provided)
      const axiosConfig = {
        method,
        url,
        responseType,
        headers: requestHeaders,
        ...(method === "GET" ? { params } : requestData != null ? { data: requestData } : {}),
      };

      const response = await axiosInstance(axiosConfig);

      setData(response.data);
      return { data: response.data, error: null };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, data, error };
}
