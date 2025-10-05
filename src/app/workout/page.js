"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Target, TrendingUp, Heart } from "lucide-react";
import NavBar from "../components/NavBar";
import { useRouter } from "next/navigation";

export default function WorkoutPage() {
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const bodyParts = {
    Arms: [
      { id: 1, title: "Bicep Curls", duration: "5 min", description: "Tone your arms with controlled bicep curl movements", icon: <Dumbbell className="w-6 h-6" /> },
      { id: 2, title: "Tricep Dips", duration: "5 min", description: "Strengthen your triceps with dips", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 7, title: "Hammer Curls", duration: "4 min", description: "Build forearm and bicep strength with neutral grip", icon: <Dumbbell className="w-6 h-6" /> },
      { id: 8, title: "Overhead Press", duration: "6 min", description: "Strengthen shoulders and triceps with pressing movement", icon: <Target className="w-6 h-6" /> },
    ],
    Legs: [
      { id: 3, title: "Squats", duration: "5 min", description: "Strengthen your legs and glutes with proper squat form", icon: <Target className="w-6 h-6" /> },
      { id: 4, title: "Lunges", duration: "5 min", description: "Improve balance and leg strength with lunges", icon: <Target className="w-6 h-6" /> },
      { id: 9, title: "Calf Raises", duration: "3 min", description: "Target your calf muscles with controlled raises", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 10, title: "Wall Sits", duration: "4 min", description: "Build leg endurance with isometric holds", icon: <Heart className="w-6 h-6" /> },
    ],
    Core: [
      { id: 5, title: "Plank", duration: "3 min", description: "Build core strength and stability with plank holds", icon: <Heart className="w-6 h-6" /> },
      { id: 6, title: "Sit-ups", duration: "5 min", description: "Strengthen your core with classic abdominal exercises", icon: <Target className="w-6 h-6" /> },
      { id: 11, title: "Russian Twists", duration: "4 min", description: "Target obliques with rotational core movement", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 12, title: "Mountain Climbers", duration: "3 min", description: "Dynamic core and cardio exercise", icon: <Dumbbell className="w-6 h-6" /> },
    ],
    Chest: [
      { id: 13, title: "Push-ups", duration: "5 min", description: "Classic chest, shoulder, and tricep exercise", icon: <Target className="w-6 h-6" /> },
      { id: 14, title: "Chest Press", duration: "6 min", description: "Build chest strength with pressing movements", icon: <Dumbbell className="w-6 h-6" /> },
      { id: 15, title: "Chest Flys", duration: "4 min", description: "Isolate chest muscles with controlled movements", icon: <Heart className="w-6 h-6" /> },
    ],
    Back: [
      { id: 16, title: "Pull-ups", duration: "6 min", description: "Strengthen your back and biceps with bodyweight pulls", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 17, title: "Rows", duration: "5 min", description: "Target middle back muscles with rowing motion", icon: <Dumbbell className="w-6 h-6" /> },
      { id: 18, title: "Reverse Flys", duration: "4 min", description: "Strengthen rear deltoids and upper back", icon: <Target className="w-6 h-6" /> },
    ],
    Shoulders: [
      { id: 19, title: "Lateral Raises", duration: "4 min", description: "Build shoulder width with side raises", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 20, title: "Front Raises", duration: "4 min", description: "Target front deltoids with forward raises", icon: <Target className="w-6 h-6" /> },
      { id: 21, title: "Shoulder Shrugs", duration: "3 min", description: "Strengthen trapezius muscles with shrugging motion", icon: <Heart className="w-6 h-6" /> },
    ],
    Cardio: [
      { id: 22, title: "Jumping Jacks", duration: "3 min", description: "Full body cardio exercise to get your heart pumping", icon: <Heart className="w-6 h-6" /> },
      { id: 23, title: "Burpees", duration: "4 min", description: "High intensity full body cardio movement", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 24, title: "High Knees", duration: "3 min", description: "Cardio exercise targeting leg muscles and endurance", icon: <Dumbbell className="w-6 h-6" /> },
    ],
    Stretching: [
      { id: 25, title: "Forward Fold", duration: "2 min", description: "Stretch your hamstrings and lower back with deep forward bend", icon: <Heart className="w-6 h-6" /> },
      { id: 26, title: "Shoulder Rolls", duration: "2 min", description: "Release shoulder tension with gentle rolling movements", icon: <TrendingUp className="w-6 h-6" /> },
      { id: 27, title: "Hip Circles", duration: "3 min", description: "Improve hip mobility with circular movements", icon: <Target className="w-6 h-6" /> },
      { id: 28, title: "Cat-Cow Stretch", duration: "3 min", description: "Warm up your spine with gentle flexion and extension", icon: <Dumbbell className="w-6 h-6" /> },
      { id: 29, title: "Quad Stretch", duration: "2 min", description: "Stretch your quadriceps muscles for better flexibility", icon: <Heart className="w-6 h-6" /> },
      { id: 30, title: "Child's Pose", duration: "3 min", description: "Relaxing stretch for your back, hips, and shoulders", icon: <TrendingUp className="w-6 h-6" /> },
    ],
  };

  const handleBodyPartClick = (bodyPart) => {
    setSelectedBodyPart(selectedBodyPart === bodyPart ? null : bodyPart);
  };

  const handleExerciseClick = (exerciseId) => {
    router.push(`/training?workout=${exerciseId}`);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 transition-opacity duration-700 ${
        pageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <NavBar />

      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className={`text-4xl lg:text-5xl font-bold text-slate-900 mb-4 transform transition-all duration-700 ${
              pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            Choose Your <span className="text-transparent" style={{ background: "linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>Exercise</span>
          </h1>
          <p 
            className={`text-xl text-slate-600 mb-8 transform transition-all duration-700 delay-100 ${
              pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            Explore exercises tailored to specific body parts. Select a category to get started and improve your fitness journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => router.push("/")}
              className={`bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform duration-700 delay-200 ${
                pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Back to Home
            </button>
          </div>
          <div className="mt-12"></div> {/* Added gap below the button */}
        </div>

        <div 
          className={`max-w-4xl mx-auto transform transition-all duration-700 delay-300 ${
            pageLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <ul className="space-y-4">
            {Object.keys(bodyParts).map((bodyPart, index) => (
              <li key={bodyPart}>
                <button
                  onClick={() => handleBodyPartClick(bodyPart)}
                  className={`w-full text-left px-6 py-4 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold transform ${
                    selectedBodyPart === bodyPart
                      ? "bg-gradient-to-br from-gray-800 to-gray-600 text-white scale-105 shadow-xl"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 text-slate-800"
                  }`}
                  style={{
                    animationDelay: `${400 + index * 100}ms`,
                    transform: pageLoaded ? 'translateX(0) translateY(0)' : 'translateX(-20px) translateY(8px)',
                    opacity: pageLoaded ? 1 : 0,
                    transition: 'all 0.6s ease-out'
                  }}
                >
                  {bodyPart}
                </button>
                {selectedBodyPart === bodyPart && (
                  <ul
                    className={`mt-4 space-y-4 pl-6 transition-all duration-[800ms] ease-in-out ${
                      selectedBodyPart === bodyPart ? "opacity-100 max-h-screen" : "opacity-0 max-h-0"
                    }`}
                    style={{ overflow: "visible" }}
                  >
                    {bodyParts[bodyPart].map((exercise, exerciseIndex) => (
                      <li
                        key={exercise.id}
                        className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ease-in-out relative z-10 cursor-pointer"
                        onClick={() => handleExerciseClick(exercise.id)}
                        style={{
                          animationDelay: `${100 + exerciseIndex * 100}ms`,
                          transform: selectedBodyPart === bodyPart ? 'translateY(0)' : 'translateY(-30px)',
                          opacity: selectedBodyPart === bodyPart ? 1 : 0,
                          transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${100 + exerciseIndex * 100}ms`,
                          marginBottom: '8px'
                        }}
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
      <div 
        className={`container mx-auto px-6 py-8 text-center transform transition-all duration-700 delay-500 ${
          pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <button
          onClick={() => router.push('/summary?from=end-workout')}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
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
