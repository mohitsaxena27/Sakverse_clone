import React, { useState, useEffect, useRef } from 'react';

const GIFoption = ({ results, testCaseId, totalSteps, completedSteps, failedSteps }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [hasFinished, setHasFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  // Extract screenshots from results
  const screenshots = results
    ?.filter((result) => result.screenshot)
    .map((result, index) => ({
      image: result.screenshot,
      step: result.step,
      status: result.status,
      index: index,
    })) || [];

  // Auto-play GIF effect - stops at the end
  useEffect(() => {
    if (!isPlaying || screenshots.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;

        // Stop at the last screenshot
        if (nextIndex >= screenshots.length) {
          setIsPlaying(false);
          setHasFinished(true);
          return prev;
        }

        return nextIndex;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, screenshots.length]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle play button click
  const handlePlayPause = () => {
    if (hasFinished) {
      setCurrentIndex(0);
      setHasFinished(false);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
     if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, hasFinished, isPlaying]);

  if (!screenshots || screenshots.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-800/30 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-sm">No screenshots available</p>
      </div>
    );
  }

  const currentScreenshot = screenshots[currentIndex];

  return (
    <div
      ref={containerRef}
      className={`space-y-2 ${isFullscreen ? 'bg-black p-4 h-screen flex flex-col' : ''}`}
    >
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 px-4 py-3 border
    ${failedSteps > 0
          ? "bg-red-950/30 border-red-800 shadow-[0_0_0_1px_rgba(220,38,38,0.4)]"
          : "bg-gray-900 border-gray-800"
        }
  `}>
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-white">
            Test Execution Preview
          </h3>
          <p className="text-xs text-gray-400">
            Test Case ID: <span className="text-gray-300">{testCaseId}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">
            Total: <strong className="text-white">{totalSteps}</strong>
          </span>

          <span className="px-2 py-1 rounded bg-green-900/40 text-green-400">
            Completed: <strong>{completedSteps}</strong>
          </span>

          <span className="px-2 py-1 rounded bg-red-900/40 text-red-400">
            Failed: <strong>{failedSteps}</strong>
          </span>
        </div>
      </div>


      {/* Main Image Display */}
      <div className={`mx-4 relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden group ${isFullscreen ? 'flex-1' : ''}`}>
        <img
          src={`data:image/webp;base64,${currentScreenshot.image}`}
          alt={currentScreenshot.step}
          className={`w-full h-auto object-contain ${isFullscreen ? 'max-h-[calc(100vh-180px)]' : 'max-h-[70vh]'}`}
        />

        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white hover:bg-black/80 hover:border-white/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
            title={hasFinished ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
          >
            {hasFinished ? (
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Fullscreen Button (Top Right) */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/30 text-white hover:bg-black/80 hover:border-white/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>

        {/* Step Overlay */}
<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
  <div className="flex items-end justify-between gap-4">
    {/* Left: Step Info */}
    <div className="flex-1">
      <p className="text-white font-medium text-2xl">
        {currentScreenshot.step}
      </p>
      <p className="text-gray-400 text-xs mt-1">
        Step {currentIndex + 1} of {screenshots.length}
      </p>
    </div>

    {/* Right: Speed Control */}
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-400 whitespace-nowrap">
        Speed
      </label>
      <select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value={2000}>0.5×</option>
        <option value={1000}>1×</option>
        <option value={500}>2×</option>
        <option value={250}>4×</option>
      </select>
    </div>
  </div>
</div>

      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 bg-gray-800/30 p-4 rounded-lg border border-gray-700">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {hasFinished ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </>
            ) : isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                {/* <span>Pause</span> */}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </>
            )}
          </button>

   
        </div>

        
      </div>
    </div>
  );
};

export default GIFoption;