/**
 * WebSocket helper for realtime task notifications.
 * Uses REACT_APP_WS_URL (example in .env: ws://host:3001/ws).
 */

const DEFAULT_WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:3001/ws";

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
