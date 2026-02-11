/**
 * WebSocket helper for realtime task notifications.
 *
 * Preferred:
 *  - REACT_APP_WS_URL=ws(s)://host:port/ws/tasks
 *
 * Fallback behavior:
 *  - If REACT_APP_WS_URL is not set, derive ws(s) base from REACT_APP_API_BASE / REACT_APP_BACKEND_URL
 *    and connect to `/ws/tasks`.
 */

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:3001";

function deriveWsUrlFromApiBase(apiBase) {
  try {
    const u = new URL(apiBase);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${u.host}/ws/tasks`;
  } catch {
    return "ws://localhost:3001/ws/tasks";
  }
}

const DEFAULT_WS_URL = process.env.REACT_APP_WS_URL || deriveWsUrlFromApiBase(API_BASE);

// PUBLIC_INTERFACE
export function connectRealtime({ token, onEvent, onStatus }) {
  /** Connect to backend WebSocket.
   * @param {string} token Bearer token (optional; sent via query param)
   * @param {(event:any)=>void} onEvent handler for message events (JSON if possible)
   * @param {(status:{state:string, error?:string})=>void} onStatus connection state updates
   * @returns {{close:()=>void}} connection handle
   */
  const wsUrl = token ? `${DEFAULT_WS_URL}?token=${encodeURIComponent(token)}` : DEFAULT_WS_URL;

  let ws = null;
  let closedByClient = false;

  const connect = () => {
    onStatus?.({ state: "connecting" });
    ws = new WebSocket(wsUrl);

    ws.onopen = () => onStatus?.({ state: "open" });

    ws.onmessage = (msg) => {
      const data = msg?.data;
      if (!data) return;
      try {
        onEvent?.(JSON.parse(data));
      } catch {
        onEvent?.({ type: "message", message: String(data) });
      }
    };

    ws.onerror = () => {
      // onerror doesn't expose much detail; rely on close event
      onStatus?.({ state: "error", error: "WebSocket error" });
    };

    ws.onclose = () => {
      onStatus?.({ state: "closed" });
      if (!closedByClient) {
        // simple reconnect with jitter
        const wait = 1000 + Math.floor(Math.random() * 1200);
        setTimeout(connect, wait);
      }
    };
  };

  connect();

  return {
    close: () => {
      closedByClient = true;
      try {
        ws?.close();
      } catch {
        // ignore
      }
    },
  };
}
