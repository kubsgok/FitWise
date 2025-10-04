"use client";

import { useState } from "react";
import { Dumbbell, Target, TrendingUp, Heart } from "lucide-react";
import NavBar from "../components/NavBar";
import { useRouter } from "next/navigation";

export default function WorkoutPage() {
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const router = useRouter();

  const bodyParts = {
    Arms: [
      { id: 1, title: "Bicep Curls", duration: "5 min", description: "Tone your arms with controlled bicep curl movements", icon: <Dumbbell className="w-6 h-6" /> },
      { id: 2, title: "Tricep Dips", duration: "5 min", description: "Strengthen your triceps with dips", icon: <TrendingUp className="w-6 h-6" /> },
    ],
    Legs: [
      { id: 3, title: "Squats", duration: "5 min", description: "Strengthen your legs and glutes with proper squat form", icon: <Target className="w-6 h-6" /> },
      { id: 4, title: "Lunges", duration: "5 min", description: "Improve balance and leg strength with lunges", icon: <Target className="w-6 h-6" /> },
    ],
    Core: [
      { id: 5, title: "Plank", duration: "3 min", description: "Build core strength and stability with plank holds", icon: <Heart className="w-6 h-6" /> },
      { id: 6, title: "Sit-ups", duration: "5 min", description: "Strengthen your core with classic abdominal exercises", icon: <Target className="w-6 h-6" /> },
    ],
  };

  const handleBodyPartClick = (bodyPart) => {
    setSelectedBodyPart(selectedBodyPart === bodyPart ? null : bodyPart);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />

      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Choose Your <span className="text-transparent" style={{ background: "linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>Exercise</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Explore exercises tailored to specific body parts. Select a category to get started and improve your fitness journey.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/home")}
              className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <ul className="space-y-4">
            {Object.keys(bodyParts).map((bodyPart) => (
              <li key={bodyPart}>
                <button
                  onClick={() => handleBodyPartClick(bodyPart)}
                  className={`w-full text-left bg-gradient-to-br from-gray-100 to-gray-200 px-6 py-4 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold text-slate-800 transform ${
                    selectedBodyPart === bodyPart ? "scale-105 shadow-xl" : ""
                  }`}
                >
                  {bodyPart}
                </button>
                {selectedBodyPart === bodyPart && (
                  <ul className="mt-4 space-y-4 pl-6 animate-fade-in">
                    {bodyParts[bodyPart].map((exercise) => (
                      <li
                        key={exercise.id}
                        className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-100 rounded-lg">{exercise.icon}</div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{exercise.title}</h3>
                              <p className="text-sm text-slate-600">{exercise.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">{exercise.duration}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* End Workout Button */}
      <div className="container mx-auto px-6 py-8 text-center">
        <button
          onClick={() => alert("Workout ended!")}
          className="bg-red-500 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          End Workout
        </button>
      </div>

      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg" style={{ background: "linear-gradient(135deg, #FF8C00 0%, #FF6B35 100%)" }}></div>
              <h3 className="text-2xl font-bold text-white">FitWise</h3>
            </div>
            <p className="text-slate-400 mb-4 mx-auto">
              The future of fitness is here. Experience personalized, AI-powered workouts that adapt to your unique needs and goals.
            </p>
            <div className="border-t border-slate-700 mt-12 pt-8">
              <p className="text-slate-400 text-center">© 2025 FitWise. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
