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
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NavBar from "../components/NavBar";
import { getSocket } from "../socket";
import LandmarkOverlay from "../components/LandmarkOverlay";
import { saveWorkoutSession } from "../../utilities/workoutStorage";

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
  const timerRef = useRef(null);

  // Live feedback tracking state
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0);
  const [lastRepCount, setLastRepCount] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [hasGivenEncouragement, setHasGivenEncouragement] = useState(false);
  const [hasGivenFormCorrection, setHasGivenFormCorrection] = useState(false);
  const feedbackCooldown = useRef(0); // Prevents too frequent feedback
  const [recentFeedbackMessages, setRecentFeedbackMessages] = useState([]); // Track recent messages
  const [formIssueCount, setFormIssueCount] = useState(0); // Track consecutive form issues
  const [lastFormMessage, setLastFormMessage] = useState(""); // Track CV feedback messages
  const [formMessageFrequency, setFormMessageFrequency] = useState({});
  // NEW: Workout tracking state for storage
  const [maxAccuracyReached, setMaxAccuracyReached] = useState(0);
  const [totalRepsCompleted, setTotalRepsCompleted] = useState(0);

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

  // Timer effect - starts/stops based on isPlaying state
  useEffect(() => {
    if (isPlaying && cameraActive) {
      // Start the timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, cameraActive]);

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
      // Cleanup timer if component unmounts
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 }, // or 3840 for 4K
          height: { ideal: 1080 },
          frameRate: { max: 30, ideal: 30 }, // smoother motion
          facingMode: "user", // front-facing camera (or "environment" for back)
        },
      });
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
    // Only activate camera if not already active
    if (!cameraActive) {
      setCameraActive(true);
    }

    // Toggle play/pause state
    setIsPlaying((prev) => !prev);

    // Track workout start time for feedback system
    if (!isPlaying && !workoutStartTime) {
      setWorkoutStartTime(Date.now());
    }
  };

  const resetWorkout = () => {
    setIsPlaying(false);
    setCurrentRep(0);
    setAccuracy(0);
    setElapsedTime(0);
    setCameraActive(false);

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset live feedback tracking
    setWorkoutStartTime(null);
    setLastFeedbackTime(0);
    setLastRepCount(0);
    setLastAccuracy(0);
    setHasGivenEncouragement(false);
    setHasGivenFormCorrection(false);
    setRecentFeedbackMessages([]);
    setFormIssueCount(0);
    setLastFormMessage("");
    feedbackCooldown.current = 0;
    setMaxAccuracyReached(0);
    setTotalRepsCompleted(0);
  };

  // NEW: Save and end workout function
  const saveAndEndWorkout = () => {
    if (!currentWorkout) return;

    const data = {
      workoutTitle: currentWorkout.title,
      workoutId: searchParams.get("workout"),
      category: currentWorkout.category || "General",
      completedReps: totalRepsCompleted,
      targetReps: currentWorkout.target,
      averageAccuracy: Math.round(accuracy),
      maxAccuracy: Math.round(maxAccuracyReached),
      duration: elapsedTime,
      targetDuration: currentWorkout.duration,
      completed: totalRepsCompleted >= currentWorkout.target,
      startTime: workoutStartTime,
      endTime: new Date(),
      percentComplete: Math.round(
        (totalRepsCompleted / currentWorkout.target) * 100
      ),
    };

    const savedSession = saveWorkoutSession(data);

    if (savedSession) {
      router.push("/summary");
    } else {
      alert("Failed to save workout. Please try again.");
    }
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

  const checkBackPostureCritical = (formMessage) => {
  if (!formMessage) return false;
  
    // Match patterns like "Deviation: 131.0°" or "Deviation: 45°"
    const deviationMatch = formMessage.match(/Deviation:\s*(\d+(?:\.\d+)?)/i);
    
    if (deviationMatch) {
      const deviation = parseFloat(deviationMatch[1]);
      if (deviation > 30) {
        return true;
      }
    }
    
    return false;
  };
  // **NEW: Intelligent live feedback system**
  // Replace lines 553-567 with this:
  const checkForLiveFeedback = (newReps, newAccuracy, formMessage) => {
    const now = Date.now();

    // **CRITICAL: Block ALL feedback if AI is currently speaking or processing**
    if (isSpeaking || isAIProcessing) return;

    // **PRIORITY 1: Critical back posture**
    if (checkBackPostureCritical(formMessage)) {
      // Changed from 10000 to 15000 (15 seconds minimum between warnings)
      const recentBackWarnings = recentFeedbackMessages.filter(
        (msg) => msg.type === "back_posture_critical" && now - msg.timestamp < 15000
      ).length;

      if (recentBackWarnings === 0) {
        feedbackCooldown.current = now;
        provideLiveFeedback("back_posture_critical", newReps, newAccuracy, formMessage);
        return;
      }
    }

  // Rest of your code continues here...

    // Prevent feedback spam (minimum 15 seconds between other AI feedback)
    if (now - feedbackCooldown.current < 15000) return;

    // Skip if AI is already processing or speaking
    if (isAIProcessing || isSpeaking || isRecording) return;

    let shouldGiveFeedback = false;
    let feedbackType = "";

    // Track form message changes
    const formMessageChanged =
      formMessage !== lastFormMessage && formMessage && formMessage.length > 0;

    // 1. Form correction feedback (low accuracy OR new form message)
    if ((newAccuracy < 50 || formMessageChanged) && newReps > 2) {
      // Track how many times each form issue appears
      setFormMessageFrequency((prev) => {
        const updated = { ...prev };
        if (formMessage) {
          updated[formMessage] = (updated[formMessage] || 0) + 1;
        }
        return updated;
      });

      // Limit to 1 correction per minute
      const recentFormCorrections = recentFeedbackMessages.filter(
        (msg) => msg.type === "form_correction" && now - msg.timestamp < 60000
      ).length;

      if (recentFormCorrections < 1) {
        shouldGiveFeedback = true;
        feedbackType = "form_correction";
        if (formMessageChanged) {
          setFormIssueCount((prev) => prev + 1);
        }
      }
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

    // 3. Rep milestone celebration
    else if (currentWorkout && newReps > 0 && newReps !== lastRepCount) {
      const shouldCelebrate =
        newReps === Math.floor(currentWorkout.target * 0.5) ||
        newReps === Math.floor(currentWorkout.target * 0.75);

      if (shouldCelebrate) {
        const recentMilestones = recentFeedbackMessages.filter(
          (msg) =>
            msg.type === "milestone_celebration" && now - msg.timestamp < 45000
        ).length;

        if (recentMilestones === 0) {
          shouldGiveFeedback = true;
          feedbackType = "milestone_celebration";
        }
      }
    }

    // 4. Workout completion
    if (
      currentWorkout &&
      newReps >= currentWorkout.target &&
      lastRepCount < currentWorkout.target
    ) {
      feedbackCooldown.current = 0;
      shouldGiveFeedback = true;
      feedbackType = "workout_complete";
    }

    // 5. Positive reinforcement
    else if (
      newAccuracy >= 90 &&
      newReps > 4 &&
      now - feedbackCooldown.current > 45000
    ) {
      const recentPositive = recentFeedbackMessages.filter(
        (msg) =>
          msg.type === "positive_reinforcement" && now - msg.timestamp < 90000
      ).length;

      if (recentPositive === 0) {
        shouldGiveFeedback = true;
        feedbackType = "positive_reinforcement";
      }
    }

    // 6. Time-based encouragement
    else if (elapsedTime === 40 && elapsedTime !== lastFeedbackTime) {
      shouldGiveFeedback = true;
      feedbackType = "time_encouragement";
      setLastFeedbackTime(elapsedTime);
    }

    if (shouldGiveFeedback) {
      feedbackCooldown.current = now;
      provideLiveFeedback(feedbackType, newReps, newAccuracy, formMessage);
    }

    // Update tracking variables
    setLastRepCount(newReps);
    setLastAccuracy(newAccuracy);
    setLastFormMessage(formMessage || "");
  };

// Helper: Generate appropriate prompt based on feedback type
const generateFeedbackPrompt = (feedbackType, reps, formMessage, recentContext) => {
  const workoutTitle = currentWorkout?.title;
  const targetReps = currentWorkout?.target;
  const avoidRepetition = recentContext 
    ? `Avoid repeating: "${recentContext}". ` 
    : "";

  const prompts = {
    // NEW: Critical back posture warning
    back_posture_critical: () =>
      `URGENT: The user's back posture angle is dangerously high during ${workoutTitle}. Tell them to straighten their back RIGHT NOW in one firm but encouraging sentence. Use words like "straighten your back" or "fix your posture".`,

    form_correction: () => {
      const topIssue = getMostFrequentFormIssue();
      
      if (topIssue || formMessage) {
        const issue = formMessage;
        return `${avoidRepetition}The user has a form issue during ${workoutTitle}: "${issue}". Give one short, natural correction focusing on this mistake.`;
      }
      
      return `${avoidRepetition}Give a brief, natural form correction for ${workoutTitle}. One conversational sentence only.`;
    },

    halfway_encouragement: () =>
      `${avoidRepetition}The user is halfway through ${workoutTitle}. Give one natural sentence of encouragement.`,

    milestone_celebration: () =>
      `${avoidRepetition}The user hit ${reps} reps for ${workoutTitle}. Give one natural sentence of celebration.`,

    workout_complete: () =>
      `${avoidRepetition}The user completed all ${targetReps} reps of ${workoutTitle}! Give one enthusiastic congratulatory sentence.`,

    positive_reinforcement: () =>
      `${avoidRepetition}The user is doing great with ${workoutTitle}. Give one natural sentence of positive reinforcement.`,

    time_encouragement: () =>
      `${avoidRepetition}The user has been working out for 90 seconds. Give one sentence of time-based encouragement.`
  };

  return prompts[feedbackType]?.() || "";
};

// Helper: Get most frequent form issue
const getMostFrequentFormIssue = () => {
  const sortedIssues = Object.entries(formMessageFrequency)
    .sort((a, b) => b[1] - a[1]);
  
  return sortedIssues.length > 0 ? sortedIssues[0][0] : null;
};

// Helper: Fetch AI feedback
const fetchAIFeedback = async (prompt) => {
  const systemPrompt = `You are Coach Mike, a motivational male fitness trainer. Give exactly ONE brief sentence of natural encouragement. Do NOT use formatting like asterisks, bullets, or multiple phrases. Do NOT include words like "Workout Commences" or stage directions. Just give one natural, conversational sentence. Examples: "Nice form on that rep!" or "Keep that energy up!" or "You're crushing it!"`;

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      systemPrompt,
      model: "gemini-2.0-flash-exp",
      options: {
        temperature: 0.9,
        maxOutputTokens: 50,
      },
    }),
  });

  if (!response.ok) return null;

  const result = await response.json();
  return result.response;
};

// Helper: Track feedback to avoid repetition
const trackFeedbackMessage = (feedbackType, content) => {
  const newMessage = {
    type: feedbackType,
    content,
    timestamp: Date.now(),
  };

  setRecentFeedbackMessages((prev) => 
    [...prev, newMessage].slice(-10) // Keep only last 10
  );
};

// Helper: Add to speech history
const addToSpeechHistory = (text) => {
  setSpeechHistory((prev) => [
    ...prev,
    {
      text: `🔴 Live: ${text}`,
      timestamp: new Date(),
      isAI: true,
      isLive: true,
    },
  ]);
};
// **NEW: Provide contextual live feedback**
const provideLiveFeedback = async (
  feedbackType,
  reps,
  currentAccuracy,
  formMessage
) => {
  // Build context to avoid repetition
  const recentContext = recentFeedbackMessages
    .slice(-3)
    .map((msg) => msg.content)
    .join("; ");

  // Generate feedback prompt based on type
  const feedbackPrompt = generateFeedbackPrompt(
    feedbackType,
    reps,
    formMessage,
    recentContext
  );

  if (!feedbackPrompt) return;

  try {
    setIsAIProcessing(true);
    const aiResponse = await fetchAIFeedback(feedbackPrompt);
    
    if (aiResponse) {
      trackFeedbackMessage(feedbackType, aiResponse);
      addToSpeechHistory(aiResponse);
      await speakText(aiResponse);
    }
  } catch (error) {
    console.error("Live feedback error:", error);
  } finally {
    setIsAIProcessing(false);
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
      // setLiveFeedback("🤖 AI is analyzing your request...");

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
      // setLiveFeedback(`AI: ${aiResult.response}`);

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
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setLiveFeedback(
        "AI assistant is temporarily unavailable. Continue your workout!"
      );
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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Full-page video background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <LandmarkOverlay
              workoutId={searchParams.get("workout")}
              videoRef={videoRef}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center text-white max-w-md backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/20">
              <Camera className="w-24 h-24 mx-auto mb-4 text-white/60" />
              <h3 className="text-2xl font-semibold mb-2">Camera Ready</h3>
              <p className="text-white/80 mb-4">
                Click below to enable your camera
              </p>
              <button
                onClick={() => setCameraActive(true)}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-white/30"
              >
                Enable Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Glassy Stats Panel - Left Side */}
      <div className="absolute top-6 left-6 z-10 w-72 space-y-4">
        {/* Reps Card */}
        <div className="backdrop-blur-xl bg-black/30 p-6 rounded-3xl border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-8 h-8 text-blue-400" />
            <span className="text-lg font-semibold text-white">Reps</span>
          </div>
          <div className="text-5xl font-bold text-white mb-3">
            {currentRep}/{currentWorkout.target}
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-blue-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Accuracy Card */}
        <div className="backdrop-blur-xl bg-black/30 p-6 rounded-3xl border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-lg font-semibold text-white">Accuracy</span>
          </div>
          <div className={`text-5xl font-bold ${getAccuracyColor(accuracy)}`}>
            {Math.round(accuracy)}%
          </div>
        </div>
      </div>

      {/* Large Live Feedback - Top Center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 max-w-2xl w-full px-4">
        <div className="backdrop-blur-xl bg-black/30 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <p className="text-2xl text-white/95 leading-relaxed text-center font-medium">
            {liveFeedback}
          </p>
        </div>
      </div>

      {/* Voice Command Overlay - Below Live Feedback */}
      {(isRecording || isProcessing || isAIProcessing || transcription) && (
        <div className="absolute top-52 left-1/2 transform -translate-x-1/2 z-10 max-w-md w-full px-4">
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-4 text-white border border-white/20 shadow-2xl">
            {isRecording && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Listening... (5s max)</span>
              </div>
            )}
            {isProcessing && !isRecording && (
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span className="text-sm">Converting speech to text...</span>
              </div>
            )}
            {isAIProcessing && (
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-pulse text-blue-400">AI</div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-bounce text-green-400">SPEAKING</div>
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

      {/* Glassy overlay controls - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-4 backdrop-blur-xl bg-black/30 rounded-full px-6 py-3 border border-white/20 shadow-2xl">
          <div className="text-white text-sm font-medium">
            Time: {formatTime(elapsedTime)}
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleWorkout}
              className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all border border-white/30 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={resetWorkout}
              className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all border border-white/30 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleVoiceRecording}
              className={`backdrop-blur-md ${
                isRecording
                  ? "bg-red-500/40 hover:bg-red-500/50 animate-pulse"
                  : "bg-white/20 hover:bg-white/30"
              } text-white p-3 rounded-full transition-all border border-white/30 shadow-lg`}
              disabled={isProcessing}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Workout Panel - Right Side */}
      <div className="absolute top-6 right-6 z-10 max-w-md w-full text-white">
        <div className="backdrop-blur-xl bg-black/30 rounded-2xl p-6 h-full shadow-xl border border-gray-100 overflow-y-auto text-black">
          {/* Back Button - MODIFIED */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => router.push("/workout")}
              className=" text-black flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all text-sm w-full justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={saveAndEndWorkout}
              className="text-white flex-1 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-all text-sm justify-center"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>

          {/* Workout Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-white">{currentWorkout.title}</h2>
            <p className="text-sm text-white">{currentWorkout.description}</p>
          </div>

          {/* Timer */}
          <div className="mb-6 p-4 backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 *:text-white">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold">Workout Time</span>
            </div>
            <div className="text-3xl font-bold">{formatTime(elapsedTime)}</div>
            <div className="text-xs mt-1">
              Target: {formatTime(currentWorkout.duration)}
            </div>
          </div>

          {/* AI Voice Assistant */}
          <div className="mb-6 p-4 backdrop-blur-md bg-blue-500/20 rounded-2xl border border-purple-400/30 *:text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">AI Voice Assistant</h3>
              <button
                onClick={toggleVoiceRecording}
                className={`p-2 rounded-lg transition-all ${
                  isRecording
                    ? "bg-red-500/40 animate-pulse"
                    : "bg-white/20 hover:bg-white/30"
                } border border-white/30`}
                disabled={isProcessing || isAIProcessing}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {transcription && (
              <div className="text-xs mb-2 p-2 backdrop-blur-sm bg-white/10 rounded border border-white/20">
                <strong>Transcribed:</strong> "{transcription}"
              </div>
            )}

            <div className="text-xs">
              <p>
                Click the microphone to speak with your AI trainer (5 sec limit)
              </p>
              <p className="mt-1">
                💬 Ask about form, get motivation, or request tips!
              </p>
            </div>
          </div>

          {/* Speech History */}
          {speechHistory.length > 0 && (
            <div className="p-4 backdrop-blur-md bg-white/10 rounded-2xl border border-white/20">
              <h3 className="text-sm font-semibold text-white mb-2">
                Recent Speech
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {speechHistory
                  .slice(-4)
                  .reverse()
                  .map((speech, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded backdrop-blur-sm ${
                        speech.isLive
                          ? "bg-red-500/30 text-white border-l-2 border-red-400"
                          : speech.isAI
                          ? "bg-blue-500/30 text-white border-l-2 border-blue-400"
                          : "bg-white/10 text-white/80"
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
