//page.js

"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../socket";

export default function Home() {
  const [time, setTime] = useState("");
  const [landmark, setLandmark] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const onLandmark = (data) => {
      console.log("🧍 Landmark received:", data);
      setLandmark(data);
    };

    socket.on("landmark", onLandmark);

    setInterval(() => {
      socket.emit("landmark", "Requesting current time");
    }, 1000);

    // ✅ Clean up listeners but keep connection alive
    return () => {
      socket.off("landmark", onLandmark);
    };
  }, []);

  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">🕒 Real-Time Data Stream</h1>
      <p className="text-xl">
        {time ? `Current time: ${time}` : "Waiting for time update..."}
      </p>

      {landmark && (
        <pre className="text-left mt-6 bg-gray-100 p-4 rounded-lg">
          {JSON.stringify(landmark, null, 2)}
        </pre>
      )}

      {/* <button onClick={() => {
        const socket = getSocket();
        socket.emit("landmark", "");
      }} className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Send Test Landmark
      </button> */}
    </main>
  );
}
