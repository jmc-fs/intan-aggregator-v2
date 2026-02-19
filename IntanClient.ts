/**
 * IntanClient.ts
 *
 * Connects to a real or fake IntanService via gRPC and calls streamhaar().
 * Receives a continuous FloatArrayChunk stream and fires registered callbacks.
 *
 * Fallback chain (fully automatic):
 *   1. gRPC → streamhaar(ChannelsArray) on IntanService (real hardware OR fake-intan-service.ts)
 *   2. Local wavelet_signal.bin file read as Float32 interleaved channels
 *   3. Gaussian random noise (Box-Muller, realistic neural signal statistics)
 *
 * Reconnection behaviour:
 *   - If gRPC is UNAVAILABLE at startup → immediately falls back (no reconnect loop)
 *   - If gRPC drops mid-stream → reconnects every RECONNECT_DELAY_MS (default 5s)
 *   - stopStreamData() cancels everything cleanly; no timers or sockets leak
 */

import * as grpc from "npm:@grpc/grpc-js";
import * as protoLoader from "npm:@grpc/proto-loader";
import * as log from "https://deno.land/std@0.224.0/log/mod.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

// ─── Proto Loading (module-level singleton) ───────────────────────────────────
// Loaded once when module is first imported — safe and efficient.

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

// ─── Constants ────────────────────────────────────────────────────────────────

const CHUNK_SIZE            = 160;    // samples per channel per emit
const STREAM_INTERVAL_MS    = 100;    // 10 Hz → 1,600 samples/sec/channel
const RECONNECT_DELAY_MS    = 5_000;  // wait before gRPC reconnect attempt
const SPIKE_THRESHOLD       = 50;     // μV — sample counts as spike above this
const MAINTENANCE_SPIKE_ON  = 800;    // spike count to trigger maintenance mode
const MAINTENANCE_SPIKE_OFF = 200;    // spike count to exit maintenance (hysteresis)

// ─── IntanClient ──────────────────────────────────────────────────────────────

export class IntanClient {
  readonly id_intan: string;
  readonly serverAddress: string;

  // Mutable config — set before calling startStreamData()
  channels: number[] = [];
  maintenance = false;
  recorded_file = "";
  recorded_nb_channels = 128;

  // Callbacks registered by Socket.IO layer
  private _dataCallbacks: Array<{ id: string; callback: (data: number[]) => void }> = [];
  private maintenanceCallbacks: Array<(status: boolean) => void> = [];

  // Internal state
  private grpcClient: any = null;
  private grpcCall: any = null;
  private fallbackInterval: number | null = null;
  private reconnectTimer: number | null = null;

  private isStarted = false;
  private stopped = false;
  private spikeCount = 0;

  constructor(serverAddress: string, idmea: string) {
    this.serverAddress = serverAddress;
    this.id_intan = idmea;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Number of active WebSocket listeners — exposed for /streams endpoint */
  get listenerCount(): number {
    return this._dataCallbacks.length;
  }

  startStreamData() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.stopped = false;
    this.connectAndStream();
  }

  stopStreamData() {
    this.stopped = true;
    this.isStarted = false; // allow restart if ever needed
    this.cancelReconnect();
    this.cleanupGrpc();
    this.clearFallback();
    log.debug(`[${this.id_intan}] Stream stopped`);
  }

  addCallback(id: string, callback: (data: number[]) => void) {
    // Deduplicate: replace existing registration for the same socket id
    this._dataCallbacks = this._dataCallbacks.filter(c => c.id !== id);
    this._dataCallbacks.push({ id, callback });
  }

  removeCallback(id: string) {
    this._dataCallbacks = this._dataCallbacks.filter(c => c.id !== id);
  }

  onMaintenanceChange(callback: (status: boolean) => void) {
    this.maintenanceCallbacks.push(callback);
  }

  setMaintenance(status: boolean) {
    if (this.maintenance !== status) {
      this.maintenance = status;
      this.maintenanceCallbacks.forEach(cb => cb(status));
    }
  }

  // ─── gRPC Connection ────────────────────────────────────────────────────────

  private connectAndStream() {
    if (this.stopped) return;

    // Always clear any active fallback before attempting gRPC.
    // This prevents the race condition where both a fallback interval
    // AND a gRPC stream run simultaneously, doubling the emit rate.
    this.clearFallback();

    log.debug(`[${this.id_intan}] Connecting gRPC → ${this.serverAddress}`);

    try {
      this.grpcClient = new IntanServiceProto(
        this.serverAddress,
        grpc.credentials.createInsecure(),
        {
          "grpc.keepalive_time_ms": 10_000,
          "grpc.keepalive_timeout_ms": 5_000,
          "grpc.keepalive_permit_without_calls": 1,
        }
      );

      const channelList = this.channels.length > 0
        ? this.channels
        : Array.from({ length: 32 }, (_, i) => i);

      this.grpcCall = this.grpcClient.streamhaar({ channels: channelList });

      this.grpcCall.on("data", (chunk: { data: number[] }) => {
        if (!chunk?.data?.length) return;
        this.processData(chunk.data);
      });

      this.grpcCall.on("error", (err: Error) => {
        const isUnavailable =
          err.message?.includes("UNAVAILABLE") ||
          err.message?.includes("connect");
        this.cleanupGrpc();

        if (isUnavailable) {
          // Server not running — use fallback, do NOT loop-retry
          log.warn(`[${this.id_intan}] gRPC unavailable (${this.serverAddress}) — using fallback`);
          this.fallbackToFile();
        } else {
          // Transient error — reconnect after delay
          log.warn(`[${this.id_intan}] gRPC error: ${err.message} — retry in ${RECONNECT_DELAY_MS / 1000}s`);
          this.scheduleReconnect();
        }
      });

      this.grpcCall.on("end", () => {
        if (!this.stopped) {
          log.warn(`[${this.id_intan}] gRPC stream ended unexpectedly — reconnecting`);
          this.cleanupGrpc();
          this.scheduleReconnect();
        }
      });

      log.info(
        `[${this.id_intan}] gRPC streamhaar connected → ${this.serverAddress} ` +
        `(${channelList.length} channels)`
      );

    } catch (e) {
      log.warn(`[${this.id_intan}] gRPC init failed: ${e} — using fallback`);
      this.fallbackToFile();
    }
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer !== null) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectAndStream();
    }, RECONNECT_DELAY_MS);
  }

  private cancelReconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private cleanupGrpc() {
    if (this.grpcCall) {
      try { this.grpcCall.cancel(); } catch { /* ignore */ }
      this.grpcCall = null;
    }
    if (this.grpcClient) {
      try { this.grpcClient.close(); } catch { /* ignore */ }
      this.grpcClient = null;
    }
  }

  // ─── Fallback 1: Bin File ────────────────────────────────────────────────────

  private async fallbackToFile() {
    if (this.stopped) return;

    if (!this.recorded_file) {
      this.generateRandomDataStream();
      return;
    }

    try {
      const raw = await Deno.readFile(this.recorded_file);

      // Math.floor prevents RangeError when file size is not a multiple of 4 bytes
      const floatData = new Float32Array(
        raw.buffer,
        raw.byteOffset,
        Math.floor(raw.byteLength / 4)
      );

      const nb_channel = this.recorded_nb_channels || 128;
      const channel_length = Math.floor(floatData.length / nb_channel);
      let offset = 0;

      log.info(
        `[${this.id_intan}] File fallback: ${this.recorded_file} ` +
        `(${floatData.length.toLocaleString()} samples, ${nb_channel} ch)`
      );

      this.fallbackInterval = setInterval(() => {
        if (this.stopped) { this.clearFallback(); return; }
        if (offset + CHUNK_SIZE > channel_length) offset = 0;

        const chunk: number[] = [];
        for (let ch = 0; ch < nb_channel; ch++) {
          const start = ch * channel_length + offset;
          chunk.push(...floatData.subarray(start, start + CHUNK_SIZE));
        }
        offset += CHUNK_SIZE;
        this.processData(chunk);
      }, STREAM_INTERVAL_MS);

    } catch {
      log.warn(`[${this.id_intan}] Cannot read "${this.recorded_file}" — using random data`);
      this.generateRandomDataStream();
    }
  }

  private clearFallback() {
    if (this.fallbackInterval !== null) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  // ─── Fallback 2: Gaussian Noise ──────────────────────────────────────────────

  private generateRandomDataStream() {
    if (this.stopped) return;
    const nb = this.channels.length || 32;
    log.info(`[${this.id_intan}] Gaussian noise fallback (${nb} channels)`);

    this.fallbackInterval = setInterval(() => {
      if (this.stopped) { this.clearFallback(); return; }

      // Box-Muller transform produces realistic neural noise statistics
      const data = Array.from({ length: CHUNK_SIZE * nb }, () => {
        const u1 = Math.random() || 1e-10;
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 15;
      });
      this.processData(data);
    }, STREAM_INTERVAL_MS);
  }

  // ─── Data Processing ────────────────────────────────────────────────────────

  private processData(data: number[]) {
    this.spikeCount = data.filter(v => Math.abs(v) > SPIKE_THRESHOLD).length;

    // Hysteresis prevents rapid toggling of maintenance mode
    if (!this.maintenance && this.spikeCount > MAINTENANCE_SPIKE_ON) {
      this.setMaintenance(true);
    } else if (this.maintenance && this.spikeCount < MAINTENANCE_SPIKE_OFF) {
      this.setMaintenance(false);
    }

    this._dataCallbacks.forEach(({ callback }) => callback(data));
  }
}
