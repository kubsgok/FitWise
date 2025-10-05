import { useEffect, useRef } from "react";

export default function LandmarkOverlay({ workoutId, videoRef }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const landmarksRef = useRef([]);
  const startTimeRef = useRef(null);

  // --- Mediapipe-like landmark connections (simplified) ---
  const connections = [
    // Upper body
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    [11, 12], // Shoulders
    // Torso
    [11, 23], [12, 24],
    [23, 24], // Hips
    // Legs
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28], // Right leg
  ];

  // Load landmark JSON when workout changes
  useEffect(() => {
    if (!workoutId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/${workoutId}.json`);
        if (!res.ok) throw new Error("Failed to load JSON");
        const data = await res.json();
        landmarksRef.current = data;
        startTimeRef.current = performance.now();
        animate();
      } catch (err) {
        console.error("❌ Error loading landmark data:", err);
      }
    };

    fetchData();
    return () => cancelAnimationFrame(animationRef.current);
  }, [workoutId]);

  // Draw loop
  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const video = videoRef.current;

    if (!canvas || !ctx || !video) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const elapsed = (performance.now() - startTimeRef.current) / 800;
    const data = landmarksRef.current;

    if (!data || data.length === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Smooth looping animation
    const totalDuration = 5;
    const progress = (elapsed % totalDuration) / totalDuration;
    const frameIndex = Math.floor(progress * data.length);
    const frame = data[frameIndex];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (frame?.landmarks) {
      const landmarks = frame.landmarks;
      const visibleLandmarks = [];

      // 🟢 For push-ups, only draw the left-side joints
      const leftSideIds = [11, 13, 15, 23, 25, 27];
      for (const pt of landmarks) {
        if (workoutId === "13" && !leftSideIds.includes(pt.id)) continue;
        visibleLandmarks.push(pt);
      }

      // --- Draw skeleton connections with glowing blue gradient ---
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(0, 200, 255, 0.8)"; // 💙 bluish glow

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(0, 255, 255, 0.9)"); // cyan
      gradient.addColorStop(0.5, "rgba(0, 180, 255, 0.9)"); // aqua blue
      gradient.addColorStop(1, "rgba(0, 120, 255, 0.9)"); // deeper blue
      ctx.strokeStyle = gradient;

      connections.forEach(([start, end]) => {
        const p1 = visibleLandmarks.find((p) => p.id === start);
        const p2 = visibleLandmarks.find((p) => p.id === end);
        if (!p1 || !p2) return;

        const x1 = p1.x * canvas.width;
        const y1 = p1.y * canvas.height;
        const x2 = p2.x * canvas.width;
        const y2 = p2.y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // --- Draw glowing joint circles ---
      visibleLandmarks.forEach((pt) => {
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 187, 255, 0.95)"; // bright aqua
        ctx.fill();

        // Inner white highlight
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();
      });
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
}
