//page.js

"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import GeminiTest from "../components/GeminiTest";

export default function Home() {
  const [time, setTime] = useState("");
  const [landmark, setLandmark] = useState(null);
  const [activeTab, setActiveTab] = useState("socket");

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
    <main className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("socket")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "socket"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Socket Test
            </button>
            <button
              onClick={() => setActiveTab("gemini")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "gemini"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Gemini API Test
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto py-6">
        {activeTab === "socket" && (
          <div className="p-6 text-center">
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
          </div>
        )}

        {activeTab === "gemini" && <GeminiTest />}
      </div>
    </main>
  );
}
