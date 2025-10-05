import { useEffect, useRef } from "react";

export default function LandmarkOverlay({ workoutId, videoRef }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const landmarksRef = useRef([]);
  const startTimeRef = useRef(null);

  // Load the landmark JSON when workoutId changes
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

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [workoutId]);

  // Draw each frame
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

    const elapsed = (performance.now() - startTimeRef.current) / 800; // seconds
    const data = landmarksRef.current;

    if (!data || data.length === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Loop animation every 5 seconds
    const totalDuration = 5;
    const progress = (elapsed % totalDuration) / totalDuration;
    const frameIndex = Math.floor(progress * data.length);
    const frame = data[frameIndex];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (frame?.landmarks) {
      frame.landmarks.forEach(pt => {
        // if positive times 5/4 or -5/4 if negative pt.x
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 183, 255, 0.7)";
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
