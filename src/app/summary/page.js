'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getWorkoutSessions, deleteSession, clearAllSessions } from '../../utilities/workoutStorage';
import { ArrowLeft, Trash2, TrendingUp, Target, Clock, Award, X, MessageSquare } from 'lucide-react';
import NavBar from '../components/NavBar';

export default function SummaryPage() {
  const [sessions, setSessions] = useState([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if accessed from "End Workout" button vs saved workout
  const fromEndWorkout = searchParams.get("from") === "end-workout";

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const data = getWorkoutSessions();
    setSessions(data.reverse()); // Most recent first
  };

  const handleDelete = (session) => {
    setSessionToDelete(session);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete.id);
      loadSessions();
    }
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = () => {
    clearAllSessions();
    loadSessions();
    setShowClearModal(false);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAverageAccuracy = () => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0);
    return Math.round(sum / sessions.length);
  };

  const getTotalWorkouts = () => sessions.length;

  const getTotalTime = () => {
    const total = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    return formatDuration(total);
  };

  const handleFeedback = (session) => {
    setSelectedSession(session);
    setShowFeedbackModal(true);
  };

  const getFeedbackMessage = (session) => {
    const accuracy = session.accuracy || 0;
    const completionRate = session.targetReps > 0 ? (session.completedReps / session.targetReps) * 100 : 0;
    
    let feedback = [];
    
    // Accuracy feedback
    if (accuracy >= 90) {
      feedback.push("🎯 Excellent form! Your accuracy is outstanding.");
    } else if (accuracy >= 75) {
      feedback.push("👍 Good form! Keep maintaining this consistency.");
    } else if (accuracy >= 60) {
      feedback.push("📈 Room for improvement. Focus on proper form over speed.");
    } else {
      feedback.push("💪 Take your time and focus on technique. Quality over quantity!");
    }
    
    // Completion feedback
    if (completionRate >= 100) {
      feedback.push("✅ Workout completed! Great dedication.");
    } else if (completionRate >= 80) {
      feedback.push("👏 Nearly there! You completed most of your workout.");
    } else if (completionRate >= 50) {
      feedback.push("🔥 Good effort! Try to complete more reps next time.");
    } else {
      feedback.push("💯 Every rep counts! Keep building your endurance.");
    }
    
    // Duration feedback
    const avgTimePerRep = session.duration / (session.completedReps || 1);
    if (avgTimePerRep < 2) {
      feedback.push("⚡ Fast-paced workout! Make sure you're maintaining proper form.");
    } else if (avgTimePerRep > 5) {
      feedback.push("🧘 Steady pace! Taking time for proper form is important.");
    }
    
    return feedback;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />
      
      {/* Feedback Modal */}
      {showFeedbackModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFeedbackModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scaleIn max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Workout Feedback</h3>
              <p className="text-gray-600 font-medium">{selectedSession.workoutTitle}</p>
              <p className="text-sm text-gray-500">{formatDate(selectedSession.timestamp)}</p>
            </div>
            
            {/* Workout Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Reps:</span>
                  <span className="ml-2 font-semibold">{selectedSession.completedReps}/{selectedSession.targetReps}</span>
                </div>
                <div>
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="ml-2 font-semibold text-green-600">{selectedSession.accuracy || 0}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-semibold">{formatDuration(selectedSession.duration)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-semibold ${selectedSession.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedSession.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Feedback Messages */}
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-900">Personalized Feedback:</h4>
              {getFeedbackMessage(selectedSession).map((message, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 text-sm leading-relaxed">{message}</div>
                </div>
              ))}
            </div>
            
            {/* Tips Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Tips for Next Time:</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Focus on consistent form throughout the workout</li>
                <li>• Take breaks when needed to maintain accuracy</li>
                <li>• Gradually increase reps as you build strength</li>
                <li>• Stay hydrated and maintain proper posture</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Delete Workout?
              </h3>
              <p className="text-gray-600">
                This will permanently delete "
                <strong>{sessionToDelete.workoutTitle}</strong>" from{" "}
                {formatDate(sessionToDelete.timestamp)}. This action cannot be
                undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <button
              onClick={() => setShowClearModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Clear All History?
              </h3>
              <p className="text-gray-600">
                This will permanently delete all {sessions.length} workout
                session{sessions.length !== 1 ? "s" : ""} from your history.
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(fromEndWorkout ? "/" : "/workout")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {fromEndWorkout ? "Back to Home" : "Back to Workouts"}
          </button>

          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Workout History
            </h1>
            {sessions.length > 0 && !fromEndWorkout && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {sessions.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-8 h-8 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Workouts
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {getTotalWorkouts()}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-600">
                  Avg Accuracy
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {getAverageAccuracy()}%
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-600">
                  Total Time
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {getTotalTime()}
              </p>
            </div>
          </div>
        )}

        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No workout history yet
            </h3>
            <p className="text-gray-500 mb-6">
              Complete your first workout to see it here
            </p>
            <button
              onClick={() => router.push("/workout")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Start a Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {session.workoutTitle}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(session.timestamp)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback(session)}
                      className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Feedback
                    </button>
                    {!fromEndWorkout && (
                      <button
                        onClick={() => handleDelete(session)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Reps</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {session.completedReps} / {session.targetReps}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p className="text-lg font-semibold text-green-600">
                      {session.accuracy || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDuration(session.duration)}
                    </p>
                  </div>
                </div>
                {/* AI Movement Analysis Section */}
                {session.collectedLandmarks &&
                  session.collectedLandmarks.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <h4 className="text-md font-semibold text-blue-700 mb-2">
                        AI Movement Analysis
                      </h4>
                      <p className="text-sm text-blue-900">
                        {aiAnalysis[session.id] || "Analyzing..."}
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
