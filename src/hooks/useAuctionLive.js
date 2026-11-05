"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSocket } from "@/services/socket";

/**
 * Live auction state over Socket.IO. The server always sends a full authoritative snapshot on (re)connect,
 * so nothing depends on receiving every historical event. Snapshots older than the one held are ignored.
 *
 * onEvent(type, payload) receives transient events (bid:placed, player:sold, bid:rejected, mystery:reveal ...).
 */
export function useAuctionLive({ authenticated = false, onEvent } = {}) {
  const [state, setState] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [team, setTeam] = useState(null);
  const [counts, setCounts] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [clockOffset, setClockOffset] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; });

  useEffect(() => {
    const s = createSocket({ authenticated });
    socketRef.current = s;
    const applyState = (snap) => {
      setClockOffset(new Date(snap.serverTime).getTime() - Date.now());
      setState((cur) => (cur && cur.status !== "NO_SEASON" && snap.version < cur.version ? cur : snap));
    };
    s.on("connect", () => setConnection("connected"));
    s.on("disconnect", (reason) => setConnection(reason === "io client disconnect" ? "closed" : "reconnecting"));
    s.io.on("reconnect_attempt", () => setConnection("reconnecting"));
    s.io.on("reconnect_failed", () => setConnection("offline"));
    s.on("connect_error", () => setConnection((c) => (c === "connected" ? "reconnecting" : c === "connecting" ? "reconnecting" : c)));
    s.on("auction:state", applyState);
    s.on("leaderboard:updated", (p) => setLeaderboard(p.rows));
    s.on("team:updated", setTeam);
    s.on("audience:count", setCounts);
    const transient = ["bid:placed", "bid:rejected", "player:finalizing", "player:sold", "player:unsold", "player:skipped", "player:current",
      "auction:started", "auction:paused", "auction:resumed", "auction:completed", "mystery:reveal", "mystery:token_used",
      "resale:requested", "resale:approved", "resale:rejected"];
    transient.forEach((t) => s.on(t, (p) => { setLastEvent({ type: t, payload: p, at: Date.now() }); onEventRef.current?.(t, p); }));
    s.connect();
    return () => { s.removeAllListeners(); s.io.removeAllListeners(); s.disconnect(); socketRef.current = null; };
  }, [authenticated]);

  /** Ask for a fresh snapshot (e.g. after a rejected action). */
  const resync = useCallback(() => {
    socketRef.current?.emit("auction:sync", null, (res) => res?.ok && setState(res.data));
  }, []);

  /** Emit with ack; resolves to the server reply or a timeout error. */
  const emit = useCallback((event, data, timeoutMs = 8000) => new Promise((resolve) => {
    const s = socketRef.current;
    if (!s?.connected) return resolve({ ok: false, error: { code: "OFFLINE", message: "Not connected. Reconnecting…" } });
    s.timeout(timeoutMs).emit(event, data, (err, res) => resolve(err ? { ok: false, error: { code: "TIMEOUT", message: "No response from server. Check the bid history before retrying." } } : res));
  }), []);

  return { state, setState, leaderboard, team, setTeam, counts, connection, clockOffset, lastEvent, resync, emit };
}
