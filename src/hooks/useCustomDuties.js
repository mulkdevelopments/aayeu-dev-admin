"use client";

import { useState, useEffect, useCallback } from "react";
import useAxios from "@/hooks/useAxios";

/**
 * Fetches admin custom duties and provides a formatter for order amounts.
 * Use on orders list, order detail, and dashboard to show duty-inclusive prices.
 */
export default function useCustomDuties() {
  const { request } = useAxios();
  const [customDuties, setCustomDuties] = useState({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/custom-duties",
          authRequired: true,
        });
        if (cancelled) return;
        if (error || !data?.success) return;
        if (data?.data && typeof data.data === "object") {
          setCustomDuties(data.data);
        }
      } catch (err) {
        if (!cancelled) console.warn("Failed to load custom duties", err);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount only; request identity would cause polling
  }, []);

  const formatOrderPrice = useCallback(
    (order, eurAmount) => {
      if (eurAmount == null) return "—";
      const sym = order?.currency_symbol || order?.currency || "€";
      const code = order?.currency || "AED";
      const rate = Number(order?.exchange_rate) ?? 1;
      const duty = Number(customDuties[code]) || 0;
      let display = Number(eurAmount) * rate;
      if (duty > 0) display = display * (1 + duty / 100);
      return `${sym}${display.toFixed(2)}`;
    },
    [customDuties]
  );

  return { customDuties, formatOrderPrice };
}
