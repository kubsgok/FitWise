// socket.js
import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:6432", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("✅ Connected to Flask-SocketIO server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ Connection error:", err.message);
    });
  }

  return socket;
}
