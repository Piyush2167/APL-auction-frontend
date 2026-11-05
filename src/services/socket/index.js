"use client";
import { io } from "socket.io-client";
import { getAccessToken, refreshSession } from "@/services/api/client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

/**
 * Creates a socket. With `authenticated`, the current access token is sent on every (re)connect,
 * and an expired token is refreshed transparently before retrying.
 */
export function createSocket({ authenticated = false } = {}) {
  const socket = io(URL, {
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    auth: (cb) => cb(authenticated ? { token: getAccessToken() } : {}),
  });
  let authRetries = 0;
  socket.on("connect", () => { authRetries = 0; });
  socket.on("connect_error", async (err) => {
    // Middleware rejections do not auto-reconnect: refresh the access token once or twice, then give up.
    if (authenticated && ["TOKEN_EXPIRED", "UNAUTHORIZED"].includes(err.message) && authRetries < 2) {
      authRetries += 1;
      try { await refreshSession(); socket.connect(); } catch { /* session gone; the route guard redirects */ }
    }
  });
  return socket;
}
