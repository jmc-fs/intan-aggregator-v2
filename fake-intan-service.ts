/**
 * fake-intan-service.ts
 *
 * Starts 4 fake gRPC IntanService servers on ports 5051–5054.
 * Implements the full IntanService interface defined in proto/api.proto.
 *
 * The key method is `streamhaar` which continuously streams FloatArrayChunk
 * data, exactly as a real Intan hardware device would.
 *
 * Data source:
 *   - wavelet_signal.bin if present (real recorded neural data)
 *   - Gaussian noise if file not found (still realistic for testing)
 *
 * Each of the 4 instances reads a different slice of the 128 channels
 * so each simulated machine produces distinct, non-identical output.
 *
 * Run: deno task fake
 */

import * as grpc from "npm:@grpc/grpc-js";
import * as protoLoader from "npm:@grpc/proto-loader";
import * as log from "https://deno.land/std@0.224.0/log/mod.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

// ─── Logging ──────────────────────────────────────────────────────────────────

await log.setup({
  handlers: { console: new log.ConsoleHandler("DEBUG") },
  loggers: { default: { level: "DEBUG", handlers: ["console"] } },
});

// ─── Proto Loading ────────────────────────────────────────────────────────────

const BASE_DIR = dirname(fromFileUrl(import.meta.url));
const PROTO_DIR = join(BASE_DIR, "proto");
const PROTO_PATH = join(PROTO_DIR, "api.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [PROTO_DIR],
});

const grpcProto = grpc.loadPackageDefinition(packageDef) as any;
const IntanServiceProto = grpcProto.api.IntanService;

// ─── Load Wavelet Data ────────────────────────────────────────────────────────

const WAVELET_NB_CHANNELS = 128;
const STREAM_INTERVAL_MS = 100; // 10 Hz
const CHUNK_SIZE = 160;         // samples per channel per chunk

let waveletData: Float32Array | null = null;

try {
  const raw = await Deno.readFile(join(BASE_DIR, "wavelet_signal.bin"));
  waveletData = new Float32Array(
    raw.buffer,
    raw.byteOffset,
    Math.floor(raw.byteLength / 4)
  );
  log.info(
    `Loaded wavelet_signal.bin: ` +
    `${waveletData.length.toLocaleString()} float32 samples / ${WAVELET_NB_CHANNELS} channels`
  );
} catch {
  log.warn("wavelet_signal.bin not found — all instances will use Gaussian noise");
}

// ─── Signal Helpers ───────────────────────────────────────────────────────────

/** Box-Muller Gaussian sample — realistic neural noise statistics */
function gaussian(mean = 0, std = 15): number {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Build one chunk of data for the requested channels.
 * Uses wavelet file data if available, Gaussian noise otherwise.
 * `waveletOffset.value` is mutated across calls to advance through the file.
 */
function buildChunk(channels: number[], waveletOffset: { value: number }): number[] {
  if (waveletData) {
    const channelLength = Math.floor(waveletData.length / WAVELET_NB_CHANNELS);
    if (waveletOffset.value + CHUNK_SIZE > channelLength) waveletOffset.value = 0;

    const chunk: number[] = [];
    for (const ch of channels) {
      const src = ch % WAVELET_NB_CHANNELS;
      const start = src * channelLength + waveletOffset.value;
      chunk.push(...Array.from(waveletData.subarray(start, start + CHUNK_SIZE)));
    }
    waveletOffset.value += CHUNK_SIZE;
    return chunk;
  }

  return Array.from({ length: CHUNK_SIZE * channels.length }, () => gaussian());
}

// ─── Service Implementation Factory ──────────────────────────────────────────

/**
 * Creates a unique service implementation for each instance.
 * Each instance has its own wavelet read offset so they emit different data.
 */
function createServiceImpl(instanceId: number, baseChannel: number) {
  // Stagger the initial offset so all 4 instances are out of phase immediately
  const waveletOffset = { value: (baseChannel * 7_919) % 50_000 };

  const allChannels = Array.from({ length: 32 }, (_, i) => i + baseChannel);
  const ok = (_: any, cb: any) => cb(null, { status: true, message: "ok" });

  // ── streamhaar ─────────────────────────────────────────────────────────────
  // Core method — implements the gRPC server-streaming RPC.
  // Receives a ChannelsArray, streams FloatArrayChunk every STREAM_INTERVAL_MS.
  function streamhaar(call: any) {
    const requested: number[] =
      call.request?.channels?.length > 0
        ? call.request.channels
        : allChannels;

    log.debug(
      `[FakeSvc:${instanceId}] streamhaar started — ` +
      `${requested.length} channels [${requested.slice(0, 4).join(",")}${requested.length > 4 ? "…" : ""}]`
    );

    let active = true;

    const interval = setInterval(() => {
      if (!active) return;
      const chunk = buildChunk(requested, waveletOffset);
      const canContinue = call.write({ data: chunk });
      if (!canContinue) {
        // Client buffer full — pause stream until "drain" event
        clearInterval(interval);
        log.warn(`[FakeSvc:${instanceId}] Back-pressure detected — stream paused`);
      }
    }, STREAM_INTERVAL_MS);

    // "cancelled" fires when the gRPC client cancels the call
    call.on("cancelled", () => {
      active = false;
      clearInterval(interval);
      log.debug(`[FakeSvc:${instanceId}] streamhaar cancelled by client`);
    });

    // "close" fires when the underlying transport closes (covers all exit paths)
    call.on("close", () => {
      active = false;
      clearInterval(interval);
    });

    call.on("error", (err: Error) => {
      active = false;
      clearInterval(interval);
      log.error(`[FakeSvc:${instanceId}] streamhaar error: ${err.message}`);
    });
  }

  return {
    // Core streaming method
    streamhaar,

    // Control RPCs — all return OK
    start: ok,
    stop: ok,
    startrecording: ok,
    stoprecording: ok,
    coefthresholds: ok,
    triggertags: ok,
    varthreshold: ok,
    expname: ok,
    stimparam: ok,
    updatestimparam: ok,
    disableallstim: ok,

    // Streaming stubs — end immediately (not needed for aggregator testing)
    listenaftertrigger: (call: any) => call.end(),
    listenaftertriggerspikes: (call: any) => call.end(),

    // Unary query stubs with realistic responses
    count: (_: any, cb: any) =>
      cb(null, { counts: new Array(allChannels.length).fill(0) }),
    debuginfo: (_: any, cb: any) =>
      cb(null, { raw_queue: 0.0, loop_ms: STREAM_INTERVAL_MS }),
    channelavailable: (_: any, cb: any) =>
      cb(null, { channels: allChannels }),
  };
}

// ─── Start All Instances ──────────────────────────────────────────────────────

const INSTANCES = [
  { id: 0, port: 5051, baseChannel: 0  },  // MEA 1 — ch 0–31
  { id: 1, port: 5052, baseChannel: 32 },  // MEA 2 — ch 32–63
  { id: 2, port: 5053, baseChannel: 64 },  // MEA 3 — ch 64–95
  { id: 3, port: 5054, baseChannel: 96 },  // MEA 4 — ch 96–127
];

let startedCount = 0;

for (const inst of INSTANCES) {
  const server = new grpc.Server();
  server.addService(IntanServiceProto.service, createServiceImpl(inst.id, inst.baseChannel));

  try {
    await new Promise<void>((resolve, reject) => {
      server.bindAsync(
        `0.0.0.0:${inst.port}`,
        grpc.ServerCredentials.createInsecure(),
        (err, boundPort) => {
          if (err) { reject(err); return; }
          log.info(
            `[FakeSvc:${inst.id}] Listening on :${boundPort} ` +
            `(ch ${inst.baseChannel}–${inst.baseChannel + 31})`
          );
          resolve();
        }
      );
    });
    startedCount++;
  } catch (e) {
    log.error(`[FakeSvc:${inst.id}] Failed to start on port ${inst.port}: ${e}`);
  }
}

if (startedCount === 0) {
  log.error("No fake services started — check that ports 5051–5054 are free");
  Deno.exit(1);
}

log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
log.info(`  ${startedCount}/${INSTANCES.length} fake IntanService instances running`);
log.info(`  Ports: ${INSTANCES.map(i => i.port).join(", ")}`);
log.info("  Ready — start the aggregator in another terminal:");
log.info("  deno task dev");
log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

Deno.addSignalListener("SIGINT", () => {
  log.info("Fake IntanService instances shutting down...");
  Deno.exit(0);
});

// Keep process alive
await new Promise(() => {});
