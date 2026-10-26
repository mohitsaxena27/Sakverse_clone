import { WebSocketServer } from 'ws';

export function attachStreamServer(server) {
  const wss = new WebSocketServer({ server });

  // let broadcaster = null;
  // const viewers = new Set();
  const sessions = new Map();

  console.log('🔌 Initializing WebSocket streaming...');

  wss.on('connection', (ws, req) => {
    try {
      // Build full URL safely (modern replacement for url.parse)
      const host = req.headers.host;
      const protocol = req.socket.encrypted ? 'https' : 'http';
      const fullUrl = new URL(req.url, `${protocol}://${host}`);
      const pathname = fullUrl.pathname;
const parts = pathname.split('/'); 
// ['', 'stream', 'abc123']

const route = parts[1];
const sessionId = parts[2];

      console.log('\n================ WS CONNECTION ================');
      console.log('📍 Path:', pathname);
      console.log('🌍 Origin:', req.headers.origin);
      console.log('🖥 Client IP:', req.socket.remoteAddress);
      console.log('🔐 Protocol:', protocol);
      console.log('===============================================\n');

      /* ================= STREAM SOURCE ================= */
      // if (pathname === '/stream') {

      //   if (broadcaster) {
      //     console.log('⚠ Closing previous broadcaster...');
      //     broadcaster.close(1000, 'New stream connected');
      //   }

      //   broadcaster = ws;
      //   console.log('🎥 Stream source connected');

      //   ws.on('message', (data) => {
      //     const size = data?.length || data?.byteLength || 0;
      //     console.log(`📦 Frame received | Size: ${size} bytes | Viewers: ${viewers.size}`);

      //     viewers.forEach(viewer => {
      //       if (viewer.readyState === 1) {
      //         viewer.send(data);
      //       }
      //     });
      //   });

      //   ws.on('close', (code, reason) => {
      //     console.log('❌ Stream source disconnected');
      //     console.log('   Code:', code);
      //     console.log('   Reason:', reason?.toString());
      //     broadcaster = null;
      //   });

      //   ws.on('error', (err) => {
      //     console.error('🚨 Broadcaster WS Error:', err);
      //   });

      // }

      if (route === 'stream') {
  let session = sessions.get(sessionId);

  if (!session) {
    session = { broadcaster: null, viewers: new Set() };
    sessions.set(sessionId, session);
  }

  if (session.broadcaster) {
    console.log(`⚠ Replacing broadcaster for session ${sessionId}`);
    session.broadcaster.close(1000, 'New stream connected');
  }

  session.broadcaster = ws;

  console.log(`🎥 Stream connected | session: ${sessionId}`);

  ws.on('message', (data) => {
    const size = data?.length || data?.byteLength || 0;

    console.log(`📦 Frame | ${size} bytes | session: ${sessionId} | viewers: ${session.viewers.size}`);

    session.viewers.forEach(viewer => {
      if (viewer.readyState === 1) {
        viewer.send(data);
      }
    });
  });

  ws.on('close', () => {
    console.log(`❌ Stream disconnected | session: ${sessionId}`);
    session.broadcaster = null;

    // 🧹 cleanup if empty
    if (session.viewers.size === 0) {
      sessions.delete(sessionId);
    }
  });
}
      /* ================= VIEWERS ================= */
      // else if (pathname === '/view') {

      //   viewers.add(ws);
      //   console.log(`👀 Viewer connected | Total viewers: ${viewers.size}`);

      //   ws.on('close', (code, reason) => {
      //     viewers.delete(ws);
      //     console.log(`👋 Viewer disconnected`);
      //     console.log('   Code:', code);
      //     console.log('   Reason:', reason?.toString());
      //     console.log('   Remaining viewers:', viewers.size);
      //   });

      //   ws.on('error', (err) => {
      //     console.error('🚨 Viewer WS Error:', err);
      //   });

      // }
else if (route === 'view') {
  let session = sessions.get(sessionId);

  if (!session) {
    session = { broadcaster: null, viewers: new Set() };
    sessions.set(sessionId, session);
  }

  session.viewers.add(ws);

  console.log(`👀 Viewer connected | session: ${sessionId} | total: ${session.viewers.size}`);

  ws.on('close', () => {
    session.viewers.delete(ws);

    console.log(`👋 Viewer left | session: ${sessionId}`);

    // 🧹 cleanup if empty
    if (!session.broadcaster && session.viewers.size === 0) {
      sessions.delete(sessionId);
    }
  });
}
      /* ================= INVALID ================= */
      else {
        console.log('⛔ Invalid WS endpoint:', pathname);
        ws.close(1002, 'Invalid endpoint');
      }

    } catch (err) {
      console.error('🚨 WebSocket connection setup failed:', err);
      ws.close(1011, 'Internal server error');
    }
  });

  wss.on('error', (err) => {
    console.error('🚨 WebSocket Server Error:', err);
  });

  console.log('✅ WebSocket server attached successfully');
}
