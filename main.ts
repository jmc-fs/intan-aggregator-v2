/**
 * main.ts — Intan Aggregator v2
 *
 * Aggregates neural data from 4 IntanService instances via gRPC (streamhaar)
 * and broadcasts it to LiveView frontend clients via Socket.IO WebSocket.
 *
 * Architecture:
 *   [IntanService :5051–5054]  ← real hardware OR fake-intan-service.ts
 *          │  gRPC streamhaar
 *          ▼
 *   [IntanClient × 4]          ← IntanClient.ts
 *          │  callbacks
 *          ▼
 *   [Aggregator HTTP:8000 / WS:3000]
 *          │  WebSocket "data" events
 *          ▼
 *   [LiveView Frontend]
 *
 * How to run:
 *   Standalone (fallback data):   deno task dev
 *   Full simulation pipeline:
 *     terminal 1 → deno task fake
 *     terminal 2 → deno task dev
 */

// Pinned Oak version — fixes "oak send() does not work under Node.js" warning
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import * as log from "https://deno.land/std@0.224.0/log/mod.ts";
import { IntanClient } from "./IntanClient.ts";

// ─── Config ───────────────────────────────────────────────────────────────────

const HTTP_PORT = 8000;
const SOCKET_PORT = 3000;

/**
 * NUMBER_X_SAMPLE: gRPC chunks buffered before one WebSocket emit.
 * At 10 Hz stream rate: 10 chunks = 1 emit/sec to frontend.
 * Reduce for lower latency, increase to reduce WebSocket message frequency.
 */
const NUMBER_X_SAMPLE = 10;

// ─── Logging ──────────────────────────────────────────────────────────────────

await log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG"),
    file: new log.FileHandler("WARN", { filename: "./logs.txt" }),
  },
  loggers: {
    default: { level: "DEBUG", handlers: ["console", "file"] },
  },
});

// ─── Socket.IO Server ─────────────────────────────────────────────────────────

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── Controller Registry (in-memory, no database) ─────────────────────────────
//
// Mirrors the IntanController MongoDB document structure from the brief.
// Each controller maps to one IntanService gRPC server (real or fake).
//
// To connect to real hardware: replace `address` with the actual host:port,
// e.g. "172.30.2.132:5051" as shown in Jean-Marc's example document.

const controllers = [
  {
    _id: "sim-0",
    name: "MEA 1",
    address: "localhost:5051",
    online: true,
    default_mea: 0,
    channels: Array.from({ length: 32 }, (_, i) => i),           // ch 0–31
    default_electrodes: Array.from({ length: 8 }, (_, i) => i),  // first 8
    recorded_file: "wavelet_signal.bin",
    recorded_nb_channels: 128,
    maintenance: false,
  },
  {
    _id: "sim-1",
    name: "MEA 2",
    address: "localhost:5052",
    online: true,
    default_mea: 1,
    channels: Array.from({ length: 32 }, (_, i) => i + 32),      // ch 32–63
    default_electrodes: Array.from({ length: 8 }, (_, i) => i + 32),
    recorded_file: "wavelet_signal.bin",
    recorded_nb_channels: 128,
    maintenance: false,
  },
  {
    _id: "sim-2",
    name: "MEA 3",
    address: "localhost:5053",
    online: true,
    default_mea: 2,
    channels: Array.from({ length: 32 }, (_, i) => i + 64),      // ch 64–95
    default_electrodes: Array.from({ length: 8 }, (_, i) => i + 64),
    recorded_file: "wavelet_signal.bin",
    recorded_nb_channels: 128,
    maintenance: false,
  },
  {
    _id: "sim-3",
    name: "MEA 4",
    address: "localhost:5054",
    online: true,
    default_mea: 3,
    channels: Array.from({ length: 32 }, (_, i) => i + 96),      // ch 96–127
    default_electrodes: Array.from({ length: 8 }, (_, i) => i + 96),
    recorded_file: "wavelet_signal.bin",
    recorded_nb_channels: 128,
    maintenance: false,
  },
];

// ─── Start IntanClients ───────────────────────────────────────────────────────

const activeClients: IntanClient[] = [];

for (const ctrl of controllers) {
  const client = new IntanClient(ctrl.address, ctrl._id);
  client.channels = ctrl.channels;
  client.recorded_file = ctrl.recorded_file;
  client.recorded_nb_channels = ctrl.recorded_nb_channels;
  client.startStreamData();
  activeClients.push(client);

  client.onMaintenanceChange((status: boolean) => {
    log.info(`[${ctrl.name}] Maintenance: ${status}`);
    io.emit("maintenance", { id_intan: ctrl._id, maintenance: status });
  });
}

// ─── HTTP Routes ──────────────────────────────────────────────────────────────

const router = new Router();

/** Health check */
router.get("/", (ctx) => {
  ctx.response.body = {
    service: "Intan Aggregator v2",
    mode: "No-DB + gRPC",
    version: "2.0.0",
    machines: controllers.length,
    ports: { http: HTTP_PORT, socket: SOCKET_PORT },
    uptime_s: Math.floor(performance.now() / 1000),
  };
});

/** List all controllers with live status */
router.get("/controllers", (ctx) => {
  ctx.response.body = {
    controllers: controllers.map((c, i) => ({
      ...c,
      channels: activeClients[i]?.channels ?? c.channels,
      maintenance: activeClients[i]?.maintenance ?? false,
    })),
  };
});

/** Live stream status — shows listener counts per machine */
router.get("/streams", (ctx) => {
  ctx.response.body = {
    status: "streaming",
    activeMachines: activeClients.length,
    machines: controllers.map((c, i) => ({
      id: c._id,
      name: c.name,
      address: c.address,
      maintenance: activeClients[i]?.maintenance ?? false,
      // Uses public getter — no private field access
      listeners: activeClients[i]?.listenerCount ?? 0,
    })),
  };
});

// ─── Socket.IO Events ─────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  log.debug(`Socket connected: ${socket.id}`);

  /**
   * "start" — subscribe to data stream for a specific machine
   * payload: { id_intan: string }
   */
  socket.on("start", (payload: any) => {
    if (!payload?.id_intan || typeof payload.id_intan !== "string") {
      log.warn(`[Socket:${socket.id}] Invalid start payload`);
      socket.emit("error", { message: "Invalid payload: id_intan required" });
      return;
    }

    const client = activeClients.find(c => c.id_intan === payload.id_intan);
    if (!client) {
      log.warn(`[Socket:${socket.id}] Unknown machine: ${payload.id_intan}`);
      socket.emit("error", { message: `Unknown machine: ${payload.id_intan}` });
      return;
    }

    // Remove any existing callback first (handles reconnect/restart)
    client.removeCallback(socket.id);

    let buffer: number[] = [];
    let chunkCount = 0;

    client.addCallback(socket.id, (data: number[]) => {
      buffer = buffer.concat(data);
      chunkCount++;
      if (chunkCount >= NUMBER_X_SAMPLE) {
        socket.emit("data", buffer);
        buffer = [];
        chunkCount = 0;
      }
    });

    log.debug(`[Socket:${socket.id}] Streaming ${payload.id_intan}`);
    socket.emit("started", { id_intan: payload.id_intan });
  });

  /**
   * "stop" — unsubscribe from a machine's data stream
   * payload: { id_intan?: string }  (omit to stop all)
   */
  socket.on("stop", (payload: any) => {
    const id = payload?.id_intan;
    if (id) {
      activeClients.find(c => c.id_intan === id)?.removeCallback(socket.id);
      log.debug(`[Socket:${socket.id}] Stopped ${id}`);
    } else {
      activeClients.forEach(c => c.removeCallback(socket.id));
      log.debug(`[Socket:${socket.id}] Stopped all streams`);
    }
  });

  /** Clean up all callbacks on disconnect */
  socket.on("disconnect", () => {
    activeClients.forEach(c => c.removeCallback(socket.id));
    log.debug(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Start Servers ────────────────────────────────────────────────────────────

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
log.info("  Intan Aggregator v2  |  No-DB + gRPC");
log.info(`  HTTP      → http://localhost:${HTTP_PORT}`);
log.info(`  Socket.IO → ws://localhost:${SOCKET_PORT}`);
log.info(`  Machines  → ${controllers.map(c => `${c.name} (${c.address})`).join(", ")}`);
log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// HTTP runs in background (not awaited)
app.listen({ port: HTTP_PORT });
// Socket.IO is awaited — keeps the process alive
await serve(io.handler(), { port: SOCKET_PORT });

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

Deno.addSignalListener("SIGINT", () => {
  log.info("Shutting down gracefully...");
  activeClients.forEach(c => c.stopStreamData());
  Deno.exit(0);
});
