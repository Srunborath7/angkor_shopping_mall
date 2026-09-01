import { useEffect } from "react";
import { useSelector } from "react-redux";
import { api } from "../api/api";

/**
 * Custom hook to maintain real-time user active / online status.
 * Automatically sends heartbeat pings to the API while the user is logged in.
 */
export function useHeartbeat() {
  const auth = useSelector((state) => state.auth);
  const token = auth?.token;
  const userId = auth?.user?.id;

  useEffect(() => {
    if (!token || !userId) return;

    let lastSent = 0;
    const PING_COOLDOWN = 30 * 1000; // minimum 30s between pings

    const sendHeartbeat = async () => {
      const now = Date.now();
      if (now - lastSent < PING_COOLDOWN) return;
      if (document.visibilityState !== "visible") return;

      try {
        lastSent = now;
        await api("/api/users/heartbeat", "POST", { user_id: userId, id: userId });
      } catch (err) {
        // Silently ignore background heartbeat errors
      }
    };

    // Send initial ping on login / page load
    sendHeartbeat();

    // Regular interval: ping every 60 seconds
    const interval = setInterval(sendHeartbeat, 60 * 1000);

    // Event listeners for active interaction
    const handleActivity = () => {
      if (Date.now() - lastSent >= PING_COOLDOWN) {
        sendHeartbeat();
      }
    };

    window.addEventListener("focus", handleActivity);
    document.addEventListener("visibilitychange", handleActivity);
    window.addEventListener("click", handleActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleActivity);
      document.removeEventListener("visibilitychange", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [token, userId]);
}

export default useHeartbeat;
