"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { getClientAccessToken } from "@/lib/api/api-client";
import { publicEnv } from "@/lib/config/public-env";
import { queryKeys } from "@/lib/query-keys";
import { backendCapabilities } from "@/config/app-config";

const realtimeUrl = publicEnv.API_BASE_URL.replace(/\/api\/v1\/?$/, "");
const bookingEvents = ["booking:confirmed", "booking:cancelled", "booking:expired", "booking:checkout_requested", "booking:settlement_completed", "booking:payment_due"] as const;

export function RealtimeSync() {
  const client = useQueryClient();
  useEffect(() => {
    if (!backendCapabilities.realtimeSocket) {
      const pollTimer = window.setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        void client.invalidateQueries({ queryKey: queryKeys.bookings.root });
        void client.invalidateQueries({ queryKey: queryKeys.wallet.root });
        void client.invalidateQueries({ queryKey: queryKeys.earnings.root });
        void client.invalidateQueries({ queryKey: queryKeys.payouts.root });
      }, 30_000);
      return () => {
        window.clearInterval(pollTimer);
      };
    }

    const socket = io(realtimeUrl, { withCredentials: true, auth: { token: getClientAccessToken() ?? undefined } });
    const refreshBookings = () => {
      void client.invalidateQueries({ queryKey: queryKeys.bookings.root });
      void client.invalidateQueries({ queryKey: queryKeys.wallet.root });
      void client.invalidateQueries({ queryKey: queryKeys.earnings.root });
    };
    const refreshPayouts = () => {
      void client.invalidateQueries({ queryKey: queryKeys.payouts.root });
      void client.invalidateQueries({ queryKey: queryKeys.wallet.root });
      void client.invalidateQueries({ queryKey: queryKeys.earnings.root });
    };
    for (const event of bookingEvents) socket.on(event, refreshBookings);
    socket.on("wallet:balance_changed", refreshBookings);
    socket.on("payout:status_changed", refreshPayouts);
    return () => { socket.disconnect(); };
  }, [client]);
  return null;
}
