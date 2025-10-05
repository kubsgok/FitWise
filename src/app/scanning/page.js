"use client";

import { useState, useEffect, useRef } from 'react';
import { Camera, User, Scan, Check, ArrowRight, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar';

export default function ScanningPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [scanningStep, setScanningStep] = useState('setup'); // setup, scanning, analyzing, complete
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [bodyMeasurements, setBodyMeasurements] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
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

  const startBodyScan = () => {
    setScanningStep('scanning');
    setScanProgress(0);
    
    // Simulate scanning process
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          analyzeScan();
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const analyzeScan = () => {
    setScanningStep('analyzing');
    
    // Simulate analysis delay
    setTimeout(() => {
      // Mock body measurements
      setBodyMeasurements({
        height: "5'8\"",
        chest: "38 inches",
        waist: "32 inches",
        hips: "36 inches",
        bodyType: "Mesomorph",
        recommendedWorkouts: ["Strength Training", "Cardio", "Flexibility"],
        fitnessScore: 85
      });
      setScanningStep('complete');
    }, 3000);
  };

  const resetScan = () => {
    setScanningStep('setup');
    setScanProgress(0);
    setBodyMeasurements(null);
  };

  const proceedToWorkouts = () => {
    router.push('/workout');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 transition-opacity duration-1000 ${
      pageLoaded ? "opacity-100" : "opacity-0"
    }`}>
      <NavBar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-4xl lg:text-5xl font-bold text-slate-900 mb-4 transform transition-all duration-1000 ${
              pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}>
              Body <span className="text-transparent" style={{ 
                background: "linear-gradient(90deg, #FF8C00 0%, #FF6B35 100%)", 
                WebkitBackgroundClip: "text", 
                backgroundClip: "text" 
              }}>Scan</span>
            </h1>
            <p className={`text-xl text-slate-600 mb-6 transform transition-all duration-1000 delay-200 ${
              pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}>
              Get personalized workout recommendations based on your body analysis
            </p>
            
            {/* Navigation buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-6 transform transition-all duration-1000 delay-300 ${
              pageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}>
              <button
                onClick={() => router.push("/")}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Back to Home
              </button>
              <button
                onClick={() => router.push("/workout")}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Go to Exercises
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Camera Section */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-2xl overflow-hidden h-[600px] relative shadow-2xl">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    
                    {/* Scanning Overlay */}
                    {scanningStep === 'scanning' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Scan className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                          <h3 className="text-2xl font-semibold mb-2">Scanning Your Body</h3>
                          <div className="w-64 bg-white/20 rounded-full h-2 mb-4">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${scanProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-lg">{scanProgress}%</p>
                        </div>
                      </div>
                    )}

                    {/* Analyzing Overlay */}
                    {scanningStep === 'analyzing' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <RotateCw className="w-16 h-16 mx-auto mb-4 animate-spin" />
                          <h3 className="text-2xl font-semibold mb-2">Analyzing Results</h3>
                          <p className="text-lg">Processing your body measurements...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center text-white max-w-md">
                      <Camera className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-2xl font-semibold mb-2">Body Scan Ready</h3>
                      <p className="text-gray-300 mb-6">
                        Position yourself in full view of the camera for accurate body analysis
                      </p>
                      <button
                        onClick={() => setCameraActive(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all mb-4"
                      >
                        Enable Camera
                      </button>
                      <div className="text-xs text-gray-400 mt-4">
                        <p>Tips for best results:</p>
                        <p>• Stand 6-8 feet from camera</p>
                        <p>• Ensure good lighting</p>
                        <p>• Wear fitted clothing</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 h-fit">
                {scanningStep === 'setup' && (
                  <>
                    <div className="text-center mb-6">
                      <User className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Scan</h3>
                      <p className="text-sm text-gray-600">
                        Make sure you're positioned properly in the camera view
                      </p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800">Camera enabled</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <User className="w-5 h-5 text-orange-600" />
                        <span className="text-sm text-orange-800">Stand in full view</span>
                      </div>
                    </div>

                    <button
                      onClick={startBodyScan}
                      disabled={!cameraActive}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      Start Body Scan
                    </button>
                  </>
                )}

                {(scanningStep === 'scanning' || scanningStep === 'analyzing') && (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {scanningStep === 'scanning' ? (
                          <Scan className="w-8 h-8 text-orange-600 animate-pulse" />
                        ) : (
                          <RotateCw className="w-8 h-8 text-orange-600 animate-spin" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {scanningStep === 'scanning' ? 'Scanning in Progress' : 'Analyzing Data'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {scanningStep === 'scanning' 
                          ? 'Please hold still while we capture your measurements'
                          : 'Processing your body composition and creating recommendations'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {scanningStep === 'complete' && bodyMeasurements && (
                  <>
                    <div className="text-center mb-6">
                      <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Scan Complete!</h3>
                    </div>
                    
                    {/* Post-scan navigation buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => router.push("/workout")}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        Start Training
                      </button>
                      <button
                        onClick={() => router.push("/")}
                        className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        Return Home
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
