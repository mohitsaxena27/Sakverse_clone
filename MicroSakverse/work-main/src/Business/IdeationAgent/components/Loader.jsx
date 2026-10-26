import React, { useEffect, useState } from 'react';

const messages = [
  "Analyzing requirements...",
  "Understanding context...",
  "Generating user stories...",
  "Optimizing outputs...",
  "Finalizing results..."
];

const Loader = ({ message = "Processing your request...", submessage = "" }) => {
  const [step, setStep] = useState(0);

  // Rotate AI messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    /* h-full to fill parent, min-h-screen to ensure it covers the viewport if needed */
    <div className="flex flex-col items-center justify-center w-full h-full  py-20 px-6 text-center bg-white">
      
      {/* --- AI CORE ANIMATION --- */}
      <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
        
        {/* Soft outer aura */}
        <div className="absolute inset-0 rounded-full bg-sky-50 animate-pulse opacity-60" />
        
        {/* Rotating dash ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky-200 animate-[spin_8s_linear_infinite]" />

        {/* The "Brain" Core Box */}
        <div className="relative w-16 h-16 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-sky-100/50 flex items-center justify-center animate-bounce duration-[2500ms]">
            <div className="w-8 h-8 bg-gradient-to-tr from-sky-400 to-indigo-400 rounded-lg rotate-45 animate-pulse shadow-lg shadow-sky-200" />
        </div>
        
        {/* Orbiting particle */}
        <div className="absolute inset-0 animate-spin duration-[3s]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-sky-500 shadow-md shadow-sky-200" />
        </div>
      </div>

      {/* Main Message */}
      <div className="relative z-10">
        <h2 className="text-slate-900 font-black text-xl md:text-2xl mb-3 tracking-tight">
          {message}
        </h2>

        {/* AI Thinking Step Container with fixed height to prevent layout shift */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-sky-500 text-sm font-bold tracking-widest uppercase transition-all duration-500 animate-in fade-in slide-in-from-bottom-1">
            {messages[step]}
          </p>
        </div>

        {/* Optional submessage */}
        {submessage && (
          <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed mt-6 font-medium">
            {submessage}
          </p>
        )}
      </div>

      {/* Clean Neural Progress Dots */}
      <div className="flex gap-4 mt-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full border-2 transition-all duration-500"
            style={{
              animation: 'loadingPulse 1.5s infinite ease-in-out',
              animationDelay: `${i * 0.3}s`,
              borderColor: i === step % 3 ? '#0ea5e9' : '#f1f5f9',
              backgroundColor: i === step % 3 ? '#0ea5e9' : 'transparent'
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes loadingPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Loader;