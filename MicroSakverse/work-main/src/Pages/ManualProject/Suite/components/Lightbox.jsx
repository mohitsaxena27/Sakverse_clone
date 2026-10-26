import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy, faCheck, faImage } from '@fortawesome/free-solid-svg-icons';
import { toImageSrc } from '../utils';

export const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — fail silently
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-gray-300 hover:text-indigo-600 transition-colors flex-shrink-0 ${className}`}
      title={copied ? 'Copied!' : 'Copy'}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[10px]" />
    </button>
  );
};

export const DonutChart = ({ passed = 0, failed = 0, skipped = 0, size = 132 }) => {
  const total = passed + failed + skipped || 1;
  const strokeWidth = 13;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = [
    { value: passed, color: '#10b981' },
    { value: failed, color: '#ef4444' },
    { value: skipped, color: '#9ca3af' },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const passRate = Math.round((passed / total) * 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const circle = (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{passRate}%</span>
        <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">Pass rate</span>
      </div>
    </div>
  );
};

export const Lightbox = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-center justify-center p-8"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Step screenshot"
        className="max-w-full max-h-full rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

export const ScreenshotThumb = ({ screenshot, onOpen }) => {
  const src = toImageSrc(screenshot);
  if (!src) {
    return (
      <div
        className="w-14 h-10 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0"
        title="No image captured"
      >
        <FontAwesomeIcon icon={faImage} className="text-gray-300 text-xs" />
      </div>
    );
  }
  return (
    <button
      onClick={() => onOpen(src)}
      className="w-14 h-10 rounded-md border border-gray-200 overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all flex-shrink-0"
      title="View screenshot"
    >
      <img src={src} alt="Step screenshot" className="w-full h-full object-cover" />
    </button>
  );
};