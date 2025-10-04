"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, Play, Pause, RotateCcw, Target, Timer, TrendingUp, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar';

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [liveFeedback, setLiveFeedback] = useState("Position yourself in front of the camera to begin");

  // Workout data based on URL params
  const workouts = {
    // Arms
    1: { title: "Bicep Curls", target: 12, duration: 300, description: "Control the weight on both up and down movements" },
    2: { title: "Tricep Dips", target: 10, duration: 300, description: "Keep your body straight and control the movement" },
    7: { title: "Hammer Curls", target: 12, duration: 240, description: "Use neutral grip and control the weight" },
    8: { title: "Overhead Press", target: 10, duration: 360, description: "Press straight up and lower with control" },
    
    // Legs
    3: { title: "Squats", target: 15, duration: 300, description: "Keep your back straight and lower down slowly" },
    4: { title: "Lunges", target: 12, duration: 300, description: "Step forward and keep your balance" },
    9: { title: "Calf Raises", target: 20, duration: 180, description: "Rise up on your toes and control the descent" },
    10: { title: "Wall Sits", target: 3, duration: 240, description: "Hold position with your back against the wall" },
    
    // Core
    5: { title: "Plank", target: 3, duration: 180, description: "Hold position and keep your core tight" },
    6: { title: "Sit-ups", target: 15, duration: 300, description: "Focus on using your core, not your neck" },
    11: { title: "Russian Twists", target: 20, duration: 240, description: "Rotate your torso while keeping your core engaged" },
    12: { title: "Mountain Climbers", target: 20, duration: 180, description: "Keep your core tight and maintain steady pace" },
    
    // Chest
    13: { title: "Push-ups", target: 12, duration: 300, description: "Keep your body in a straight line from head to heels" },
    14: { title: "Chest Press", target: 10, duration: 360, description: "Control the weight both up and down" },
    15: { title: "Chest Flys", target: 12, duration: 240, description: "Use controlled movements and feel the stretch" },
    
    // Back
    16: { title: "Pull-ups", target: 8, duration: 360, description: "Pull yourself up using your back muscles" },
    17: { title: "Rows", target: 12, duration: 300, description: "Pull the weight towards your torso" },
    18: { title: "Reverse Flys", target: 15, duration: 240, description: "Squeeze your shoulder blades together" },
    
    // Shoulders
    19: { title: "Lateral Raises", target: 12, duration: 240, description: "Lift weights to the side with control" },
    20: { title: "Front Raises", target: 12, duration: 240, description: "Lift weights to the front with straight arms" },
    21: { title: "Shoulder Shrugs", target: 15, duration: 180, description: "Lift your shoulders up and squeeze" },
    
    // Cardio
    22: { title: "Jumping Jacks", target: 30, duration: 180, description: "Jump with energy and maintain rhythm" },
    23: { title: "Burpees", target: 10, duration: 240, description: "Complete movement from squat to jump" },
    24: { title: "High Knees", target: 30, duration: 180, description: "Lift your knees high and pump your arms" },
    
    // Stretching
    25: { title: "Forward Fold", target: 1, duration: 120, description: "Stretch forward slowly and hold the position" },
    26: { title: "Shoulder Rolls", target: 10, duration: 120, description: "Roll your shoulders in smooth circles" },
    27: { title: "Hip Circles", target: 10, duration: 180, description: "Move your hips in controlled circular motions" },
    28: { title: "Cat-Cow Stretch", target: 10, duration: 180, description: "Alternate between arching and rounding your back" },
    29: { title: "Quad Stretch", target: 2, duration: 120, description: "Hold your foot behind you and feel the stretch" },
    30: { title: "Child's Pose", target: 1, duration: 180, description: "Relax in this restorative position" },
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
        
        // Generate live feedback based on accuracy
        const currentAcc = accuracy;
        if (currentAcc >= 90) {
          setLiveFeedback("Excellent form! Keep it up!");
        } else if (currentAcc >= 75) {
          setLiveFeedback("Good form. Try to maintain control throughout the movement.");
        } else if (currentAcc >= 60) {
          setLiveFeedback("Focus on your posture. Keep your back straight.");
        } else {
          setLiveFeedback("Slow down and focus on proper form over speed.");
        }
        
        if (Math.random() > 0.95 && currentWorkout) {
          setCurrentRep((prev) => Math.min(currentWorkout.target, prev + 1));
        }
      }, 1000);
    } else {
      setLiveFeedback("Ready to start your workout");
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentWorkout, accuracy]);

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
              </div>
            </div>
          </div>

          {/* Workout Panel - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 h-full shadow-xl border border-gray-100">
              {/* Back Button */}
              <div className="mb-4">
                <button
                  onClick={() => router.push('/workout')}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all text-sm w-full justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Exercises
                </button>
              </div>

              {/* Workout Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentWorkout.title}</h2>
                <p className="text-gray-600 text-sm">{currentWorkout.description}</p>
              </div>

              {/* Live Feedback */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Live Feedback</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{liveFeedback}</p>
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
