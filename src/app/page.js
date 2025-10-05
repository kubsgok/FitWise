"use client";

import {Dumbbell, Timer, ChartBarDecreasing} from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from './components/NavBar';

export default function HomePage() {
  const router = useRouter();

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />

      <section className="container mx-auto px-6 py-20">
  <div className="max-w-6xl mx-auto">
    <div className="grid lg:grid-cols-1 gap-12 items-center">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Your <span className="text-transparent" style={{background: 'linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>AI Fitness</span> Coach Awaits
        </h1>
        <p className="text-xl text-slate-600 mb-8 ">
          Experience personalized workouts powered by artificial intelligence. Get real-time form corrections, curated training plans, and achieve your fitness goals faster than ever.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => router.push('/workout')}
            className="text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105" 
            style={{background: 'linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)'}}
          >
            Begin Your Workout
          </button>
          <button 
            className="bg-white text-slate-700 border-2 border-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all transform hover:scale-105" 
            onMouseEnter={(e) => {e.target.style.borderColor = '#FF6B35'; e.target.style.color = '#FF6B35'}} 
            onMouseLeave={(e) => {e.target.style.borderColor = ''; e.target.style.color = ''}}
          >
            Watch Demo
          </button>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto w-full animate-fade-in-up animation-delay-300">
        <div className="bg-gradient-to-br from-gray-700 to-gray-500 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4 animate-slide-in-left">
              <h3 className="text-lg font-semibold">Today's Workout</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between animate-slide-in-right animation-delay-100 hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                <div className="flex flex-col">
                  <span>Push-ups</span>
                  <span className="text-xs text-white/70">Accuracy: 92%</span>
                </div>
                <span className="bg-white/30 px-2 py-1 rounded text-sm hover:bg-white/40 transition-all duration-300">3x12</span>
              </div>
              <div className="flex items-center justify-between animate-slide-in-right animation-delay-200 hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                <div className="flex flex-col">
                  <span>Squats</span>
                  <span className="text-xs text-white/70">Accuracy: 85%</span>
                </div>
                <span className="bg-white/30 px-2 py-1 rounded text-sm hover:bg-white/40 transition-all duration-300">3x15</span>
              </div>
              <div className="flex items-center justify-between animate-slide-in-right animation-delay-300 hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                <div className="flex flex-col">
                  <span>Plank</span>
                  <span className="text-xs text-white/70">Accuracy: 96%</span>
                </div>
                <span className="bg-white/30 px-2 py-1 rounded text-sm hover:bg-white/40 transition-all duration-300">45s</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/30 animate-slide-in-up animation-delay-400">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-white h-2 rounded-full animate-progress-fill transition-all duration-1000 ease-out" style={{width: '78%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-on-scroll">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Choose Your Perfect Workout
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Select from our curated collection of expert-designed workouts. AI technology provides real-time form feedback and tracks your progress as you train.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 animate-on-scroll">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 animate-slide-up animation-delay-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-6 hover:shadow-xl transition-all transform hover:scale-110 hover:rotate-3">
                  <Dumbbell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Curated Workout Library</h3>
                <p className="text-slate-600">
                  Choose from expertly designed workouts for different goals - strength, cardio, flexibility, and more.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 animate-slide-up animation-delay-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6 hover:shadow-xl transition-all transform hover:scale-110 hover:rotate-3">
                  <Timer className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Real-time Form Analysis</h3>
                <p className="text-slate-600">
                  Get instant feedback on your exercise form using computer vision and motion tracking.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 animate-slide-up animation-delay-300 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-6 hover:shadow-xl transition-all transform hover:scale-110 hover:rotate-3">
                  <ChartBarDecreasing className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Session Summary</h3>
                <p className="text-slate-600">
                  At the end of each session you get a simple summary: reps, average form score, and trouble areas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



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
