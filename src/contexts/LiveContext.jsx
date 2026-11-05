"use client";
import { createContext, useCallback, useContext } from "react";
import { useAuctionLive } from "@/hooks/useAuctionLive";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { points } from "@/components/ui";

const LiveContext = createContext(null);

/** One authenticated socket per signed-in area (admin or captain), shared by all its pages. */
export function LiveProvider({ children }) {
  const toast = useToast();
  const { user } = useAuth();
  const onEvent = useCallback((type, p) => {
    if (type === "player:sold") toast.success(`${p.player?.name} sold to ${p.team?.name} for ${points(p.amount)}`);
    else if (type === "player:unsold") toast.info(`${p.player?.name} went unsold`);
    else if (type === "resale:requested" && user?.role === "ADMIN") toast.info(`New resale request from ${p.team?.name}`);
    else if (type === "resale:approved" && user?.role === "CAPTAIN") toast.success(`Resale approved: ${points(p.refund)} credited to your purse`);
    else if (type === "resale:rejected" && user?.role === "CAPTAIN") toast.error(`Resale rejected: ${p.reason}`);
    else if (type === "mystery:token_used" && user?.role === "ADMIN") toast.info(`${p.team?.name} used its Mystery Token`);
  }, [toast, user?.role]);
  const live = useAuctionLive({ authenticated: true, onEvent });
  return <LiveContext.Provider value={live}>{children}</LiveContext.Provider>;
}

export const useLive = () => useContext(LiveContext);
