"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Target,
  Timer,
  TrendingUp,
  ArrowLeft,
  Mic,
  MicOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NavBar from "../components/NavBar";
import { getSocket } from "../socket";
import LandmarkOverlay from "../components/LandmarkOverlay";

/** 4) Feature-detect the best audio MIME type for this browser */
function pickAudioMime() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4", // Safari often ends up here
  ];
  for (const t of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported?.(t)
    )
      return t;
  }
  return ""; // let browser decide
}

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef(null);

  // Existing state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [liveFeedback, setLiveFeedback] = useState(
    "Position yourself in front of the camera to begin"
  );

  // Speech-to-text state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [speechHistory, setSpeechHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // Live feedback tracking state
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0);
  const [lastRepCount, setLastRepCount] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [hasGivenEncouragement, setHasGivenEncouragement] = useState(false);
  const [hasGivenFormCorrection, setHasGivenFormCorrection] = useState(false);
  const feedbackCooldown = useRef(0); // Prevents too frequent feedback

  // Workout data based on URL params
  const workouts = {
    // Arms
    1: {
      title: "Bicep Curls",
      target: 12,
      duration: 300,
      description: "Control the weight on both up and down movements",
    },
    2: {
      title: "Tricep Dips",
      target: 10,
      duration: 300,
      description: "Keep your body straight and control the movement",
    },
    7: {
      title: "Hammer Curls",
      target: 12,
      duration: 240,
      description: "Use neutral grip and control the weight",
    },
    8: {
      title: "Overhead Press",
      target: 10,
      duration: 360,
      description: "Press straight up and lower with control",
    },

    // Legs
    3: {
      title: "Squats",
      target: 15,
      duration: 300,
      description: "Keep your back straight and lower down slowly",
    },
    4: {
      title: "Lunges",
      target: 12,
      duration: 300,
      description: "Step forward and keep your balance",
    },
    9: {
      title: "Calf Raises",
      target: 20,
      duration: 180,
      description: "Rise up on your toes and control the descent",
    },
    10: {
      title: "Wall Sits",
      target: 3,
      duration: 240,
      description: "Hold position with your back against the wall",
    },

    // Core
    5: {
      title: "Plank",
      target: 3,
      duration: 180,
      description: "Hold position and keep your core tight",
    },
    6: {
      title: "Sit-ups",
      target: 15,
      duration: 300,
      description: "Focus on using your core, not your neck",
    },
    11: {
      title: "Russian Twists",
      target: 20,
      duration: 240,
      description: "Rotate your torso while keeping your core engaged",
    },
    12: {
      title: "Mountain Climbers",
      target: 20,
      duration: 180,
      description: "Keep your core tight and maintain steady pace",
    },

    // Chest
    13: {
      title: "Push-ups",
      target: 12,
      duration: 300,
      description: "Keep your body in a straight line from head to heels",
    },
    14: {
      title: "Chest Press",
      target: 10,
      duration: 360,
      description: "Control the weight both up and down",
    },
    15: {
      title: "Chest Flys",
      target: 12,
      duration: 240,
      description: "Use controlled movements and feel the stretch",
    },

    // Back
    16: {
      title: "Pull-ups",
      target: 8,
      duration: 360,
      description: "Pull yourself up using your back muscles",
    },
    17: {
      title: "Rows",
      target: 12,
      duration: 300,
      description: "Pull the weight towards your torso",
    },
    18: {
      title: "Reverse Flys",
      target: 15,
      duration: 240,
      description: "Squeeze your shoulder blades together",
    },

    // Shoulders
    19: {
      title: "Lateral Raises",
      target: 12,
      duration: 240,
      description: "Lift weights to the side with control",
    },
    20: {
      title: "Front Raises",
      target: 12,
      duration: 240,
      description: "Lift weights to the front with straight arms",
    },
    21: {
      title: "Shoulder Shrugs",
      target: 15,
      duration: 180,
      description: "Lift your shoulders up and squeeze",
    },

    // Cardio
    22: {
      title: "Jumping Jacks",
      target: 30,
      duration: 180,
      description: "Jump with energy and maintain rhythm",
    },
    23: {
      title: "Burpees",
      target: 10,
      duration: 240,
      description: "Complete movement from squat to jump",
    },
    24: {
      title: "High Knees",
      target: 30,
      duration: 180,
      description: "Lift your knees high and pump your arms",
    },

    // Stretching
    25: {
      title: "Forward Fold",
      target: 1,
      duration: 120,
      description: "Stretch forward slowly and hold the position",
    },
    26: {
      title: "Shoulder Rolls",
      target: 10,
      duration: 120,
      description: "Roll your shoulders in smooth circles",
    },
    27: {
      title: "Hip Circles",
      target: 10,
      duration: 180,
      description: "Move your hips in controlled circular motions",
    },
    28: {
      title: "Cat-Cow Stretch",
      target: 10,
      duration: 180,
      description: "Alternate between arching and rounding your back",
    },
    29: {
      title: "Quad Stretch",
      target: 2,
      duration: 120,
      description: "Hold your foot behind you and feel the stretch",
    },
    30: {
      title: "Child's Pose",
      target: 1,
      duration: 180,
      description: "Relax in this restorative position",
    },
  };

  useEffect(() => {
    const workoutId = searchParams.get("workout");
    if (workoutId && workouts[workoutId]) {
      setCurrentWorkout(workouts[workoutId]);
    }

    const socket = getSocket();

    // only connect if not already connected
    if (!socket.connected && cameraActive) {
      socket.connect();
    }

    // listener
    const handleLandmark = async (data) => {
      const parsedData = JSON.parse(data);
      const latestLandmarks = parsedData.landmarks;
      const workoutId = searchParams.get("workout");

      const accuracyScore = await compareLandmarksAccuracy(
        latestLandmarks,
        workoutId
      );
      setAccuracy(accuracyScore);

      const newReps = parsedData.reps;
      setCurrentRep(newReps);

      let message = parsedData.message;
      if (message && message.length > 0) {
        setLiveFeedback(message);
      }

      // **NEW: Trigger intelligent live feedback**
      checkForLiveFeedback(newReps, accuracyScore, message);

      // console.log("💡 Feedback message:", message);
    };
    socket.on("landmark", handleLandmark);

    // interval to emit every second
    const intervalId = setInterval(() => {
      if (socket.connected) {
        socket.emit("landmark", workoutId);
      }
    }, 1000);

    // cleanup on unmount or page change
    return () => {
      console.log("🧹 Cleaning up socket + interval");
      clearInterval(intervalId);
      socket.off("landmark", handleLandmark);
      socket.disconnect(); // or comment this out if you want to persist connection
    };
  }, [searchParams, cameraActive]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      // Cleanup audio if component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [cameraActive]);

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

    // Track workout start time for feedback system
    if (!isPlaying && !workoutStartTime) {
      setWorkoutStartTime(Date.now());
    }

    setIsPlaying(!isPlaying);
  };

  const resetWorkout = () => {
    setIsPlaying(false);
    setCurrentRep(0);
    setAccuracy(0);
    setElapsedTime(0);
    setCameraActive(false);

    // Reset live feedback tracking
    setWorkoutStartTime(null);
    setLastFeedbackTime(0);
    setLastRepCount(0);
    setLastAccuracy(0);
    setHasGivenEncouragement(false);
    setHasGivenFormCorrection(false);
    feedbackCooldown.current = 0;
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

  // Speech-to-Text Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000, // browsers commonly use 48k; server will downsample to 16k
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: pickAudioMime(), // 4) feature-detected
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        await processAudioForSpeechToText(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setLiveFeedback("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioForSpeechToText = async (audioBlob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      // Use a sensible filename extension to help the server pick container
      const ext =
        (audioBlob.type.includes("mp4") && "m4a") ||
        (audioBlob.type.includes("ogg") && "ogg") ||
        (audioBlob.type.includes("webm") && "webm") ||
        "webm";
      formData.append("audio", audioBlob, `recording.${ext}`);

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const result = await response.json();
      setTranscription(result.text);

      // Add to speech history
      setSpeechHistory((prev) => [
        ...prev,
        {
          text: result.text,
          timestamp: new Date(),
        },
      ]);

      // **NEW: Call Gemini API with the transcribed text**
      await processWithGeminiAPI(result.text);
    } catch (error) {
      console.error("Error processing audio:", error);
      setLiveFeedback("Speech recognition failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // **NEW: Intelligent live feedback system**
  const checkForLiveFeedback = (newReps, newAccuracy, formMessage) => {
    const now = Date.now();

    // Prevent feedback spam (minimum 15 seconds between AI feedback)
    if (now - feedbackCooldown.current < 15000) return;

    // Skip if AI is already processing or speaking
    if (isAIProcessing || isSpeaking || isRecording) return;

    let shouldGiveFeedback = false;
    let feedbackType = "";

    // 1. Form correction feedback (low accuracy)
    if (newAccuracy < 60 && !hasGivenFormCorrection && newReps > 2) {
      shouldGiveFeedback = true;
      feedbackType = "form_correction";
      setHasGivenFormCorrection(true);
    }

    // 2. Progress encouragement (halfway point)
    else if (
      currentWorkout &&
      newReps >= Math.floor(currentWorkout.target / 2) &&
      !hasGivenEncouragement
    ) {
      shouldGiveFeedback = true;
      feedbackType = "halfway_encouragement";
      setHasGivenEncouragement(true);
    }

    // 3. Rep milestone celebration (every 5 reps for longer workouts)
    else if (
      currentWorkout &&
      currentWorkout.target > 10 &&
      newReps > 0 &&
      newReps % 5 === 0 &&
      newReps !== lastRepCount
    ) {
      shouldGiveFeedback = true;
      feedbackType = "milestone_celebration";
    }

    // 4. Workout completion
    else if (
      currentWorkout &&
      newReps >= currentWorkout.target &&
      lastRepCount < currentWorkout.target
    ) {
      shouldGiveFeedback = true;
      feedbackType = "workout_complete";
    }

    // 5. Time-based encouragement (every 2 minutes)
    else if (
      elapsedTime > 0 &&
      elapsedTime % 120 === 0 &&
      elapsedTime !== lastFeedbackTime
    ) {
      shouldGiveFeedback = true;
      feedbackType = "time_encouragement";
      setLastFeedbackTime(elapsedTime);
    }

    if (shouldGiveFeedback) {
      feedbackCooldown.current = now;
      provideLiveFeedback(feedbackType, newReps, newAccuracy);
    }

    // Update tracking variables
    setLastRepCount(newReps);
    setLastAccuracy(newAccuracy);
  };

  // **NEW: Provide contextual live feedback**
  const provideLiveFeedback = async (feedbackType, reps, currentAccuracy) => {
    let feedbackPrompt = "";

    switch (feedbackType) {
      case "form_correction":
        feedbackPrompt = `The user's form accuracy is low (${currentAccuracy}%) during ${currentWorkout?.title}. Give a quick form correction tip in 1 sentence as their coach. (${reps}/${currentWorkout?.target} reps)`;
        break;

      case "halfway_encouragement":
        feedbackPrompt = `The user is halfway through their ${currentWorkout?.title} set (${reps}/${currentWorkout?.target} reps). Give motivational encouragement in 1 sentence.`;
        break;

      case "milestone_celebration":
        feedbackPrompt = `The user just hit ${reps} reps of ${currentWorkout?.title}. Give a quick celebration and motivation to keep going in 1 sentence. (${reps}/${currentWorkout?.target} reps)`;
        break;

      case "workout_complete":
        feedbackPrompt = `The user just completed their ${currentWorkout?.title} workout (${currentWorkout?.target} reps)! Celebrate their achievement in 1 enthusiastic sentence. (${reps}/${currentWorkout?.target} reps)`;
        break;

      case "time_encouragement":
        feedbackPrompt = `The user has been working out for ${Math.floor(
          elapsedTime / 60
        )} minutes doing ${
          currentWorkout?.title
        }. Give time-based motivation in 1 sentence. (${reps}/${
          currentWorkout?.target
        } reps)`;
        break;
    }

    if (feedbackPrompt) {
      try {
        setIsAIProcessing(true);

        const systemPrompt = `You are Coach Mike, a motivational male fitness trainer. Give very brief (1 sentence), encouraging live feedback during workouts. Use phrases like "Let's go!", "You got this!", "Keep it up!", "Beast mode!", "Nice work!", "Stay strong!". Be enthusiastic and witty since this is live coaching during exercise.`;

        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: feedbackPrompt,
            systemPrompt: systemPrompt,
            model: "gemini-2.0-flash-exp",
            options: {
              temperature: 0.8,
              maxOutputTokens: 50, // Very short responses
            },
          }),
        });

        if (response.ok) {
          const aiResult = await response.json();

          // Add to speech history with live feedback indicator
          setSpeechHistory((prev) => [
            ...prev,
            {
              text: `🔴 Live: ${aiResult.response}`,
              timestamp: new Date(),
              isAI: true,
              isLive: true,
            },
          ]);

          // Speak the feedback
          await speakText(aiResult.response);
        }
      } catch (error) {
        console.error("Live feedback error:", error);
      } finally {
        setIsAIProcessing(false);
      }
    }
  };

  // **NEW: Function to convert text to speech**
  const speakText = async (text) => {
    try {
      setIsSpeaking(true);

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: "IKne3meq5aSn9XLyUdCD", // Custom fitness coach voice
          voiceSettings: {
            stability: 0.7, // More stable for coaching
            similarity_boost: 0.8, // Higher similarity for consistency
            style: 0.2, // Slight style enhancement
            use_speaker_boost: true, // Enhance vocal presence
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("Error in text-to-speech:", error);
      setIsSpeaking(false);
    }
  };

  // **NEW: Function to process speech with Gemini API**
  const processWithGeminiAPI = async (transcribedText) => {
    try {
      setIsAIProcessing(true);
      setLiveFeedback("🤖 AI is analyzing your request...");

      // Create a fitness-focused system prompt
      const systemPrompt = `You are Coach Mike, a motivational male fitness trainer and bodybuilder with 15+ years of experience. You have a deep, encouraging voice and speak like a supportive gym coach. The user is currently doing a ${currentWorkout?.title} workout.
      
      Your personality:
      - Strong, motivational, and encouraging like a bodybuilder coach
      - Use phrases like "Let's go!", "You got this!", "Beast mode!", "Keep pushing!"
      - Be supportive but firm, like a personal trainer who believes in their client
      - Keep responses concise (1-2 sentences max) but impactful
      - Focus on proper form, motivation, and pushing through challenges
      
      Current workout: ${currentWorkout?.title}
      Current reps: ${currentRep}/${currentWorkout?.target}
      Workout description: ${currentWorkout?.description}
      
      Respond as Coach Mike would - motivational, masculine, and focused on helping them crush their workout!`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: transcribedText,
          systemPrompt: systemPrompt,
          model: "gemini-2.0-flash-exp",
          options: {
            temperature: 0.7,
            maxOutputTokens: 150, // Keep responses short
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiResult = await response.json();

      // Display AI response in live feedback
      setLiveFeedback(`AI: ${aiResult.response}`);

      // Add AI response to speech history
      setSpeechHistory((prev) => [
        ...prev,
        {
          text: `AI: ${aiResult.response}`,
          timestamp: new Date(),
          isAI: true,
        },
      ]);

      // **NEW: Convert AI response to speech**
      await speakText(aiResult.response);

      // Clear the AI response after 8 seconds to show normal feedback
      setTimeout(() => {
        setLiveFeedback("Ready for your next question or command");
      }, 8000);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setLiveFeedback(
        "AI assistant is temporarily unavailable. Continue your workout!"
      );

      // Show user's original message
      setTimeout(() => {
        setLiveFeedback(`You said: "${transcribedText}"`);
        setTimeout(() => {
          setTranscription("");
          setLiveFeedback("Ready for your next question or command");
        }, 4000);
      }, 2000);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  const toggleVoiceRecording = () => {
    // Stop any current AI speech before recording
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 5) Console helper to test the API with a known-good WAV in /public/sample.wav
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testSpeechToText = async function () {
        try {
          const blob = await (await fetch("/sample.wav")).blob(); // put a small test wav in /public
          const fd = new FormData();
          fd.append("audio", blob, "sample.wav");
          console.log("Uploading /sample.wav to /api/speech-to-text…");
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          console.log("API result:", data);
          return data;
        } catch (e) {
          console.error("testSpeechToText failed:", e);
        }
      };
      // Usage in console: testSpeechToText()
    }
  }, []);

  if (!currentWorkout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* <NavBar /> */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Camera View - Left Side */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-2xl overflow-hidden h-full relative shadow-2xl">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* 🟢 Overlay landmark animation */}
                  <LandmarkOverlay
                    workoutId={searchParams.get("workout")}
                    videoRef={videoRef}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center text-white max-w-md">
                    <Camera className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-2xl font-semibold mb-2">
                      Camera Ready
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Click below to enable your camera
                    </p>
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
                  <span className="text-sm">
                    Time: {formatTime(elapsedTime)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={toggleWorkout}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>

                  <button
                    onClick={resetWorkout}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>

                  <button
                    onClick={toggleVoiceRecording}
                    className={`${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700 animate-pulse"
                        : "bg-purple-600 hover:bg-purple-700"
                    } text-white p-3 rounded-full transition-all transform hover:scale-105 shadow-lg`}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Voice Command Overlay */}
              {(isRecording ||
                isProcessing ||
                isAIProcessing ||
                transcription) && (
                <div className="absolute top-6 left-6 right-6">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
                    {isRecording && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Listening... (5s max)</span>
                      </div>
                    )}
                    {isProcessing && !isRecording && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span className="text-sm">
                          Converting speech to text...
                        </span>
                      </div>
                    )}
                    {isAIProcessing && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-pulse text-blue-400">🤖</div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    )}
                    {isSpeaking && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-bounce text-green-400">🔊</div>
                        <span className="text-sm">AI is speaking...</span>
                      </div>
                    )}
                    {transcription && (
                      <div className="text-sm">
                        <strong>You said:</strong> "{transcription}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Workout Panel - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 h-full shadow-xl border border-gray-100 overflow-y-auto">
              {/* Back Button */}
              <div className="mb-4">
                <button
                  onClick={() => router.push("/workout")}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all text-sm w-full justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Exercises
                </button>
              </div>

              {/* Workout Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentWorkout.title}
                </h2>
                <p className="text-gray-600 text-sm">
                  {currentWorkout.description}
                </p>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      Reps
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {currentRep}/{currentWorkout.target}
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      Accuracy
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getAccuracyColor(
                      accuracy
                    )}`}
                  >
                    {Math.round(accuracy)}%
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-900">
                    Workout Time
                  </span>
                </div>
                <div className="text-3xl font-bold text-orange-800">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Target: {formatTime(currentWorkout.duration)}
                </div>
              </div>

              {/* Live Feedback */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Live Feedback
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {liveFeedback}
                </p>
              </div>

              {/* Speech-to-Text Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-purple-900">
                    AI Voice Assistant
                  </h3>
                  <button
                    onClick={toggleVoiceRecording}
                    className={`p-2 rounded-lg transition-all ${
                      isRecording
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                    disabled={isProcessing || isAIProcessing}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isProcessing && (
                  <p className="text-xs text-purple-600 mb-2">
                    🎤 Converting speech to text...
                  </p>
                )}

                {isAIProcessing && (
                  <p className="text-xs text-blue-600 mb-2">
                    🤖 AI is thinking...
                  </p>
                )}

                {isSpeaking && (
                  <p className="text-xs text-green-600 mb-2">
                    🔊 AI is speaking...
                  </p>
                )}

                {transcription && (
                  <div className="text-xs text-purple-700 mb-2 p-2 bg-purple-100 rounded">
                    <strong>Transcribed:</strong> "{transcription}"
                  </div>
                )}

                <div className="text-xs text-purple-600">
                  <p>
                    Click the microphone to speak with your AI trainer (5 sec
                    limit)
                  </p>
                  <p className="text-purple-500 mt-1">
                    💬 Ask about form, get motivation, or request tips!
                  </p>
                </div>
              </div>

              {/* Speech History */}
              {speechHistory.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Recent Speech
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {speechHistory
                      .slice(-4)
                      .reverse()
                      .map((speech, index) => (
                        <div
                          key={index}
                          className={`text-xs p-2 rounded ${
                            speech.isLive
                              ? "bg-red-100 text-red-800 border-l-2 border-red-400"
                              : speech.isAI
                              ? "bg-blue-100 text-blue-800 border-l-2 border-blue-400"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <div className="font-medium">{speech.text}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {speech.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// New function to compare landmarks accuracy
// Compare live landmarks to the best-matching reference frame
async function compareLandmarksAccuracy(latestLandmarks, workoutId) {
  try {
    const res = await fetch(`/${workoutId}.json`);
    if (!res.ok) throw new Error("Failed to load reference JSON");
    const referenceFrames = await res.json();

    if (!referenceFrames?.length || !latestLandmarks) return 0;

    // 🔹 Focus only on torso + leg joints
    const importantJoints = [11, 12, 23, 24, 25, 26];

    // --- Find the reference frame most similar to current live pose ---
    let bestMatchFrame = null;
    let bestScore = Infinity;

    for (const frame of referenceFrames) {
      const refMap = {};
      frame.landmarks.forEach((pt) => (refMap[pt.id] = pt));

      let frameScore = 0;
      let count = 0;

      for (const pt of latestLandmarks) {
        if (!importantJoints.includes(pt.id)) continue;
        const refPt = refMap[pt.id];
        if (!refPt) continue;

        const dx = pt.x - refPt.x;
        const dy = pt.y - refPt.y;
        const dz = (pt.z || 0) - (refPt.z || 0);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        frameScore += dist;
        count++;
      }

      if (count > 0) {
        const avgDist = frameScore / count;
        if (avgDist < bestScore) {
          bestScore = avgDist;
          bestMatchFrame = frame;
        }
      }
    }

    if (!bestMatchFrame) return 0;

    // --- Calculate accuracy vs best match ---
    const refMap = {};
    bestMatchFrame.landmarks.forEach((pt) => (refMap[pt.id] = pt));

    let totalScore = 0;
    let count = 0;
    const toleranceFactor = 3.5; // 🔹 lenient scaling

    for (const pt of latestLandmarks) {
      if (!importantJoints.includes(pt.id)) continue;
      const refPt = refMap[pt.id];
      if (!refPt) continue;

      const dx = pt.x - refPt.x;
      const dy = pt.y - refPt.y;
      const dz = (pt.z || 0) - (refPt.z || 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const score = Math.max(0, 1 - dist * toleranceFactor);
      totalScore += score;
      count++;
    }

    const rawAccuracy = count > 0 ? (totalScore / count) * 100 : 0;

    // --- Smooth output so it doesn’t jump too fast ---
    if (!window._smoothedAccuracy) window._smoothedAccuracy = rawAccuracy;
    const smoothed = window._smoothedAccuracy * 0.8 + rawAccuracy * 0.2;
    window._smoothedAccuracy = smoothed;

    return Math.round(smoothed);
  } catch (err) {
    console.error("Accuracy comparison error:", err);
    return 0;
  }
}

