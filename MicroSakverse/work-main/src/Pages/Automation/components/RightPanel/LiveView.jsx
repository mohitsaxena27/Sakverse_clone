import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ---------------- Utility ---------------- */
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const getWebSocketUrl = (sessionId) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/view/${sessionId}`;
};

const arrayBufferToDataUrl = (buffer, mimeType = 'image/jpeg') => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Use chunk processing to avoid call stack limits on large frames
  const CHUNK = 8192;
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
};

/* ---------------- Component ---------------- */
const LiveView = ({ totalSteps = 0, completedSteps = 0, status = 'PENDING', sessionId }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const fpsCountRef = useRef({ count: 0, lastTick: Date.now() });
  const startTimeRef = useRef(Date.now());
  const isMountedRef = useRef(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState('0s');

  

  /* ---------------- Duration Timer ---------------- */
  useEffect(() => {
    const id = setInterval(() => {
      setDuration(formatDuration(Date.now() - startTimeRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---------------- Canvas Placeholder ---------------- */
  const drawPlaceholder = useCallback((wsUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = 'bold 16px ui-monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UNITE Live Stream', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '12px ui-monospace';
    ctx.fillText(wsUrl, canvas.width / 2, canvas.height / 2 + 10);
  }, []);

  /* ---------------- WebSocket ---------------- */
  useEffect(() => {
    if (!sessionId) return;

    isMountedRef.current = true;
    const wsUrl = getWebSocketUrl(sessionId);
    drawPlaceholder(wsUrl);

    const connect = () => {
      if (!isMountedRef.current) return;

      console.group('🔌 WebSocket');
      console.log('Connecting to:', wsUrl);
      console.groupEnd();

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return ws.close();
        console.log('✅ WebSocket Connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        // FPS tracking
        const now = Date.now();
        fpsCountRef.current.count++;
        if (now - fpsCountRef.current.lastTick >= 1000) {
          setFps(fpsCountRef.current.count);
          fpsCountRef.current = { count: 0, lastTick: now };
        }

        setFrameCount((n) => n + 1);

        const dataUrl = arrayBufferToDataUrl(event.data);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.onerror = (err) => console.error('❌ Image decode failed:', err);
        img.src = dataUrl;
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.warn('⚠ WebSocket Closed:', event.code, event.reason);
        setIsConnected(false);
        // Reconnect with backoff
        reconnectTimeout.current = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error('🚨 WebSocket Error:', err);
        if (isMountedRef.current) setIsConnected(false);
      };
    };

    connect();

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [sessionId, drawPlaceholder]); // reconnects if sessionId changes

  /* ---------------- Fullscreen ---------------- */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);


  /* ---------------- Render ---------------- */
return (
  <div className="h-full flex flex-col gap-4 p-4 bg-neutral-950">
    {/* Status Bar */}
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-neutral-900/50 rounded-lg px-3 py-1.5 border border-neutral-800">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className={`text-sm font-medium ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {!isFullscreen && (
          <>
            <Stat label="Steps" value={totalSteps} />
            <Stat
              label="Passed"
              value={completedSteps}
              highlight={totalSteps > 0 && completedSteps === totalSteps}
            />
            <Stat label="TIME" value={duration} />
            <Stat label="FPS" value={fps} />
          </>
        )}
        <Stat label="Frames" value={frameCount} />
        {/* <Stat label="FPS (Live)" value={fps} /> */}
      </div>
    </div>

    {/* Browser Frame */}
    <div
      ref={containerRef}
      className="relative flex flex-col flex-1 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500 shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
        </div>
        <div className="flex-1 truncate rounded-lg bg-neutral-800/50 px-3 py-1.5 border border-neutral-700">
          <span className="font-mono text-sm text-neutral-300">
            {sessionId ? getWebSocketUrl(sessionId) : 'Connecting…'}
          </span>
        </div>
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all duration-200"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={1280}
          height={650}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  </div>
);
};

const Stat = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 hover:border-neutral-700 transition-all duration-200">
    <div className={`text-base font-bold  ${highlight ? 'text-emerald-400' : 'text-neutral-200'}`}>
      {value}
    </div>
    <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">{label}</div>
  </div>
);

export default LiveView;