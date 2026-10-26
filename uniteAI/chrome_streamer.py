import base64
import asyncio
import ssl
import threading
import websockets
from queue import Queue, Empty
from playwright.sync_api import Page

# STREAM_SERVER_WS = "wss://tcg.saksoft.com:3000/stream"
STREAM_SERVER_WS = "wss://host.docker.internal:3000/stream"
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


class ChromeStreamer:
    def __init__(self, cdp_session,sessionid):
        self.cdp = cdp_session
        self.session_id = sessionid
        self.ws = None

        # latest-frame-only queue
        self.frame_queue = Queue(maxsize=1)
        self._stop_event = threading.Event()

        self.loop = asyncio.new_event_loop()
        self.sender_task = None

        self.thread = threading.Thread(
            target=self._run_loop,
            daemon=True
        )
        self.thread.start()


    # -------------------------
    # Event loop runner
    # -------------------------
    async def _async_shutdown(self):
        # cancel sender task
        if self.sender_task:
            self.sender_task.cancel()
            try:
                await self.sender_task
            except asyncio.CancelledError:
                pass

        # close websocket cleanly
        if self.ws:
            try:
                await self.ws.close()
            except Exception:
                pass
    def _run_loop(self):
        asyncio.set_event_loop(self.loop)
        self.sender_task = self.loop.create_task(self._sender())
        self.loop.run_forever()
        self.loop.close()
        # print("🧹 Event loop closed")

    # -------------------------
    # WebSocket sender
    # -------------------------
    # async def _sender(self):
    #     print("🔌 Connecting to stream server...")
    #     self.ws = await websockets.connect(
    #         STREAM_SERVER_WS,
    #         ssl=ssl_context,
    #         ping_interval=20,
    #         ping_timeout=20,
    #         max_queue=1
    #     )
    #     print("✅ Connected to stream server")
    #
    #     try:
    #         while True:
    #             frame = await asyncio.to_thread(self._get_frame)
    #
    #             # ONLY exit on explicit stop
    #             if frame is None:
    #                 break
    #
    #             if not self.ws.close:
    #                 print("📤 WS SEND", len(frame))
    #                 await self.ws.send(frame)
    #
    #     except asyncio.CancelledError:
    #         pass
    #
    #     finally:
    #         print("🔌 Closing WebSocket")
    #         try:
    #             if self.ws and not self.ws.close:
    #                 await self.ws.close()
    #         except Exception:
    #             pass

    async def _sender(self):
        # print("🔌 Connecting to stream server...")
        print("Going to send the frame")
        self.ws = await websockets.connect(
            f"{STREAM_SERVER_WS}/{self.session_id}",
            # STREAM_SERVER_WS,
            ssl=ssl_context,
            ping_interval=20,
            ping_timeout=20,
            max_queue=1
        )
        print("✅ Connected to stream server")

        try:
            while not self._stop_event.is_set():
                try:
                    frame = self.frame_queue.get_nowait()
                except Exception:
                    await asyncio.sleep(0.01)  # 🔑 allow loop to breathe
                    continue

                if frame is None:
                    break

                print("📤 WS SEND", len(frame))
                await self.ws.send(frame)

        except asyncio.CancelledError:
            pass

        finally:
            # print("🔌 Closing WebSocket")
            try:
                if self.ws:
                    try:
                        await self.ws.close()
                    except Exception:
                        pass
            except Exception:
                pass

    def _get_frame(self):
        try:
            return self.frame_queue.get(timeout=1)
        except Empty:
            return None

    # -------------------------
    # Start screencast
    # -------------------------
    def start(self):
        self.cdp.send("Page.enable")
        self.cdp.send("Page.startScreencast", {
            "format": "jpeg",
            "quality": 90,
            "maxWidth": 1920,
            "maxHeight": 1080,
            "everyNthFrame": 2
        })

        def on_frame(params):
            if self._stop_event.is_set():
                return
            # print("📸 CDP FRAME RECEIVED")
            img = base64.b64decode(params["data"])

            try:
                if self.frame_queue.full():
                    self.frame_queue.get_nowait()
                # print("📥 QUEUE PUT", len(img))
                self.frame_queue.put_nowait(img)
            except Exception:
                pass

            self.cdp.send("Page.screencastFrameAck", {
                "sessionId": params["sessionId"]
            })

        self.cdp.on("Page.screencastFrame", on_frame)

    # -------------------------
    # STOP (🔥 FIXED)
    # -------------------------
    # def stop(self):
    #     if self._stop_event.is_set():
    #         return
    #
    #     print("🛑 Stopping ChromeStreamer")
    #     self._stop_event.set()
    #
    #     try:
    #         self.cdp.send("Page.stopScreencast")
    #     except Exception:
    #         pass
    #
    #     # unblock sender immediately
    #     try:
    #         self.frame_queue.put_nowait(None)
    #     except Exception:
    #         pass
    #
    #     # cancel sender task FIRST
    #     if self.sender_task:
    #         self.loop.call_soon_threadsafe(self.sender_task.cancel)
    #
    #     # stop loop LAST
    #     self.loop.call_soon_threadsafe(self.loop.stop)
    #
    #     # wait for thread exit
    #     self.thread.join(timeout=5)

    def stop(self):
        if self._stop_event.is_set():
            return

        # print("🛑 Stopping ChromeStreamer")
        self._stop_event.set()

        # stop screencast
        try:
            self.cdp.send("Page.stopScreencast")
        except Exception:
            pass

        # unblock sender
        try:
            self.frame_queue.put_nowait(None)
        except Exception:
            pass

        # 🔥 CRITICAL: await task shutdown INSIDE loop
        if self.loop and self.loop.is_running():
            future = asyncio.run_coroutine_threadsafe(
                self._async_shutdown(),
                self.loop
            )
            future.result(timeout=5)  # WAIT until sender fully exits

            # now it is SAFE to stop loop
            self.loop.call_soon_threadsafe(self.loop.stop)

        # wait for thread exit
        if self.thread:
            self.thread.join(timeout=5)
