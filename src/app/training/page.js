"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, Play, Pause, RotateCcw, Target, Timer, TrendingUp } from 'lucide-react';
import NavBar from '../components/NavBar';

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

  // Workout data based on URL params
  const workouts = {
    1: { title: "Squats", target: 15, duration: 300, description: "Keep your back straight and lower down slowly" },
    2: { title: "Push-ups", target: 12, duration: 300, description: "Keep your body in a straight line from head to heels" },
    3: { title: "Bicep Curls", target: 12, duration: 300, description: "Control the weight on both up and down movements" },
    4: { title: "Shoulder Press", target: 10, duration: 300, description: "Press straight up and lower with control" },
    5: { title: "Plank", target: 1, duration: 180, description: "Hold position and keep your core tight" },
    6: { title: "Sit-ups", target: 15, duration: 300, description: "Focus on using your core, not your neck" }
  };

  useEffect(() => {
    const workoutId = searchParams.get('workout');
    if (workoutId && workouts[workoutId]) {
      setCurrentWorkout(workouts[workoutId]);
    } else {
      setCurrentWorkout(workouts[1]); // Default workout
    }
  }, [searchParams]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraActive]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setAccuracy((prev) => Math.min(100, prev + Math.random() * 5 - 2));
        if (Math.random() > 0.95 && currentWorkout) {
          setCurrentRep((prev) => Math.min(currentWorkout.target, prev + 1));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentWorkout]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert("Unable to access the camera. Please check permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const toggleWorkout = () => {
    if (!cameraActive) {
      setCameraActive(true);
    }
    setIsPlaying(!isPlaying);
  };

  const resetWorkout = () => {
    setIsPlaying(false);
    setCurrentRep(0);
    setAccuracy(0);
    setElapsedTime(0);
    setCameraActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 90) return "text-green-600";
    if (acc >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressPercentage = () => {
    if (!currentWorkout) return 0;
    return Math.min(100, (currentRep / currentWorkout.target) * 100);
  };

  if (!currentWorkout) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Camera View - Left Side */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-2xl overflow-hidden h-full relative shadow-2xl">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center text-white max-w-md">
                    <Camera className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-2xl font-semibold mb-2">Camera Ready</h3>
                    <p className="text-gray-300 mb-4">Click below to enable your camera</p>
                    <button
                      onClick={() => setCameraActive(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all mb-4"
                    >
                      Enable Camera
                    </button>
                    <div className="text-xs text-gray-400 mt-2">
                      <p>Troubleshooting:</p>
                      <p>• Allow camera permissions when prompted</p>
                      <p>• Make sure no other apps are using your camera</p>
                      <p>• Try refreshing the page if needed</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Overlay Controls */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                  <span className="text-sm">Time: {formatTime(elapsedTime)}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={toggleWorkout}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={resetWorkout}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className={`text-sm font-semibold ${getAccuracyColor(accuracy)}`}>
                    Form: {Math.round(accuracy)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Workout Panel - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 h-full shadow-xl border border-gray-100">
              {/* Workout Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentWorkout.title}</h2>
                <p className="text-gray-600 text-sm">{currentWorkout.description}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{currentRep}</div>
                  <div className="text-sm text-blue-700">of {currentWorkout.target}</div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${getAccuracyColor(accuracy)}`}>
                    {Math.round(accuracy)}%
                  </div>
                  <div className="text-sm text-green-700">Accuracy</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Timer */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center">
                  <Timer className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-xl font-mono font-semibold text-gray-900">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="text-center text-sm text-gray-500 mt-1">
                  Target: {formatTime(currentWorkout.duration)}
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    isPlaying
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isPlaying ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                  {isPlaying ? "Workout Active" : "Ready to Start"}
                </div>
              </div>

              {/* Completion Message */}
              {currentRep >= currentWorkout.target && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  <div className="text-green-800 font-semibold">🎉 Great Job!</div>
                  <div className="text-green-600 text-sm mt-1">You completed all reps!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
