"use client";

import { Dumbbell, Clock, Zap, Heart, Target, Play, Users, TrendingUp } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useEffect } from 'react';
import NavBar from '../components/NavBar';

export default function WorkoutPage() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const workouts = [
    {
      id: 1,
      title: "Squats",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Strengthen your legs and glutes with proper squat form",
      color: "from-orange-500 to-orange-400",
      bgColor: "bg-orange-500/30",
      borderColor: "border-orange-400",
      icon: <Target className="w-6 h-6" />
    },
    {
      id: 2,
      title: "Push-ups",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Build upper body strength with classic push-ups",
      color: "from-red-500 to-red-400",
      bgColor: "bg-red-500/30",
      borderColor: "border-red-400",
      icon: <Dumbbell className="w-6 h-6" />
    },
    {
      id: 3,
      title: "Bicep Curls",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Tone your arms with controlled bicep curl movements",
      color: "from-orange-500 to-orange-400",
      bgColor: "bg-orange-500/30",
      borderColor: "border-orange-400",
      icon: <Dumbbell className="w-6 h-6" />
    },
    {
      id: 4,
      title: "Shoulder Press",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Strengthen your shoulders with overhead pressing movements",
      color: "from-red-500 to-red-400",
      bgColor: "bg-red-500/30",
      borderColor: "border-red-400",
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 5,
      title: "Plank",
      duration: "3 min",
      difficulty: "Beginner",
      description: "Build core strength and stability with plank holds",
      color: "from-orange-500 to-orange-400",
      bgColor: "bg-orange-500/30",
      borderColor: "border-orange-400",
      icon: <Heart className="w-6 h-6" />
    },
    {
      id: 6,
      title: "Sit-ups",
      duration: "5 min",
      difficulty: "Beginner",
      description: "Strengthen your core with classic abdominal exercises",
      color: "from-red-500 to-red-400",
      bgColor: "bg-red-500/30",
      borderColor: "border-red-400",
      icon: <Target className="w-6 h-6" />
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartWorkout = (workout) => {
    alert(`Starting ${workout.title}! This would navigate to the workout session.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <NavBar />

      {/* Page Title */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Choose Your <span className="text-transparent" style={{background: 'linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>Exercise</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Select an exercise to practice with AI-powered form analysis
          </p>
          <button
            onClick={() => useRouter().push('/')}
            className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-base hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            Back to Home
          </button>
        </div>
      </section>

      {/* Workouts Grid */}
      <section className="container mx-auto px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout, index) => (
              <div
                key={workout.id}
                className={`bg-gradient-to-br ${workout.bgColor} rounded-2xl border ${workout.borderColor} p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-on-scroll flex flex-col justify-between`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  minHeight: '250px', // Reduced box height
                }}
              >
                {/* Workout Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${workout.color} rounded-xl flex items-center justify-center text-white`}>
                      {workout.icon}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-slate-600 text-sm mb-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {workout.duration}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>
                        {workout.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Workout Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{workout.title}</h3>
                    <p className="text-slate-600 text-sm">{workout.description}</p>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={() => handleStartWorkout(workout)}
                  className={`w-full bg-gradient-to-r ${workout.color} text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 mt-auto`}
                >
                  <Play className="w-4 h-4" />
                  <span>Start Exercise</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* End Workout Button */}
      <div className="container mx-auto px-6 pt-8 pb-10 text-center">
        <button
          onClick={() => alert('Workout ended!')}
          className="bg-red-500 text-white px-8 py-4 rounded-xl font-semibold text-base hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          End Workout
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg" style={{background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B35 100%)'}}></div>
              <h3 className="text-2xl font-bold text-white">FitWise</h3>
            </div>
            <p className="text-slate-400 mb-4 mx-auto">
              The future of fitness is here. Experience personalized, AI-powered workouts that adapt to your unique needs and goals.
            </p>
            <div className="border-t border-slate-700 mt-12 pt-8">
              <p className="text-slate-400 text-center">
                © 2025 FitWise. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
