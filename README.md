# Intan Aggregator v2

Aggregates neural data from multiple Intan MEA machines via gRPC (`streamhaar`) and
broadcasts it to a LiveView frontend over Socket.IO WebSocket. No database required.

---

## Architecture

```
[IntanService :5051–5054]   ← real hardware  OR  fake-intan-service.ts
        │  gRPC streamhaar(ChannelsArray) → stream FloatArrayChunk
        ▼
[IntanClient × 4]           ← IntanClient.ts
        │  callbacks
        ▼
[Aggregator HTTP:8000 / WS:3000]   ← main.ts
        │  WebSocket "data" events
        ▼
[LiveView Frontend]         ← livemea.finalspark.com/live
```

### Fallback chain (automatic, per machine)
1. **gRPC** — calls `streamhaar` on real or fake IntanService
2. **File** — reads `wavelet_signal.bin` as Float32 interleaved channels
3. **Gaussian noise** — Box-Muller noise at neural signal statistics (σ=15 μV)

---

## What changed from v1

| Issue | v1 | v2 |
|---|---|---|
| Database | MongoDB required | Removed — pure in-memory |
| `streamhaar` | Not implemented | gRPC call to IntanService |
| GRPC | Proto files only, unused | Fully wired in IntanClient |
| Fake IntanService | Missing | `fake-intan-service.ts` (4 instances) |
| Channel count | Hardcoded 32/128 | Dynamic from controller config |
| File size limit | 100 MB hard limit | Removed |
| File not found | Silent crash | Graceful fallback to noise |
| Oak warning | Present (unpinned) | Fixed — Oak pinned to v12.6.1 |
| Proto folders | `proto/` + `protos/` (duplicate) | Merged to `proto/` only |
| `IntanController.ts` | Orphaned | Removed |
| `database.ts` | Present but unused | Removed |
| `.gitignore` | Missing | Added — excludes .bin and logs |

---

## Repository structure

```
intan-aggregator-v2/
├── proto/
│   ├── api.proto            ← IntanService gRPC definition
│   └── stimparam.proto      ← Stimulation parameter types
├── IntanClient.ts           ← gRPC client + fallback streamer
├── fake-intan-service.ts    ← 4 fake gRPC servers (testing only)
├── main.ts                  ← Aggregator: HTTP + Socket.IO
├── deno.json                ← Tasks: dev, start, fake
├── .gitignore
└── README.md
```

---

## Prerequisites

- [Deno](https://deno.land/) v1.38 or later
- `wavelet_signal.bin` — place in project root (not committed to git, share separately)
- Ports 3000, 5051–5054, 8000 free

---

## Step-by-step: Run the full simulation pipeline

### Step 1 — Clone and enter the repo

```powershell
git clone https://github.com/Ashioya-ui/intan-aggregator-v2.git
cd intan-aggregator-v2
```

### Step 2 — Copy the wavelet file into the project root

```powershell
copy "C:\path\to\wavelet_signal.bin" "C:\path\to\intan-aggregator-v2\wavelet_signal.bin"
```

### Step 3 — Open two terminals

**Terminal 1 — start the fake gRPC IntanService instances:**

```powershell
cd C:\path\to\intan-aggregator-v2
deno task fake
```

Expected output:
```
INFO Loaded wavelet_signal.bin: 12,800,000 float32 samples / 128 channels
INFO [FakeSvc:0] Listening on :5051 (ch 0–31)
INFO [FakeSvc:1] Listening on :5052 (ch 32–63)
INFO [FakeSvc:2] Listening on :5053 (ch 64–95)
INFO [FakeSvc:3] Listening on :5054 (ch 96–127)
INFO 4/4 fake IntanService instances running
```

**Terminal 2 — start the aggregator:**

```powershell
cd C:\path\to\intan-aggregator-v2
deno task dev
```

Expected output:
```
INFO Intan Aggregator v2  |  No-DB + gRPC
INFO HTTP      → http://localhost:8000
INFO Socket.IO → ws://localhost:3000
INFO [sim-0] gRPC streamhaar connected → localhost:5051 (32 channels)
INFO [sim-1] gRPC streamhaar connected → localhost:5052 (32 channels)
INFO [sim-2] gRPC streamhaar connected → localhost:5053 (32 channels)
INFO [sim-3] gRPC streamhaar connected → localhost:5054 (32 channels)
```

### Step 4 — Verify endpoints

Open in browser or curl:

```
http://localhost:8000/              → service info
http://localhost:8000/controllers   → list of 4 machines
http://localhost:8000/streams       → live stream status + listener counts
```

---

## Step-by-step: Run aggregator only (no fake gRPC)

If the fake gRPC servers are not running, each IntanClient automatically falls
back to reading `wavelet_signal.bin`, then to Gaussian noise. No configuration
change needed.

```powershell
deno task dev
```

You will see:
```
WARN [sim-0] gRPC unavailable (localhost:5051) — using fallback
INFO [sim-0] File fallback: wavelet_signal.bin (12,800,000 samples, 128 ch)
```

---

## Step-by-step: Connect to real hardware

Edit the `controllers` array in `main.ts`. Replace `address` with the real host:port:

```typescript
{
  _id: "mea-real-1",
  name: "MEA Real 1",
  address: "172.30.2.132:5051",   // ← real IntanService address
  channels: Array.from({ length: 32 }, (_, i) => i),
  ...
}
```

Then restart the aggregator. No other changes needed.

---

## Socket.IO API

Connect to `ws://localhost:3000`

### Subscribe to a machine

```javascript
socket.emit("start", { id_intan: "sim-0" });
socket.on("data", (buffer) => {
  // buffer: number[]
  // length = 160 samples/ch × 32 channels × 10 chunks = 51,200 values
  // interleaved: [ch0_s0, ch0_s1, ..., ch0_s159, ch1_s0, ...]
});
socket.on("started", (info) => console.log("Stream started:", info));
```

### Stop receiving

```javascript
socket.emit("stop", { id_intan: "sim-0" }); // stop one machine
socket.emit("stop", {});                     // stop all
```

### Maintenance mode alerts

```javascript
socket.on("maintenance", ({ id_intan, maintenance }) => {
  console.log(`Machine ${id_intan} maintenance: ${maintenance}`);
});
```

---

## Connecting the LiveView frontend

The aggregator exposes the same Socket.IO interface as Jean-Marc's original v1.
Point the frontend WebSocket URL at `ws://localhost:3000` (or the server's IP
in production). The `data` event format is unchanged: a flat `number[]` array
of Float32 values, interleaved by channel.

---

## Push to GitHub

```powershell
cd C:\intanagg

# Delete legacy files
del database.ts
del IntanController.ts
# Delete the duplicate protos\ folder in File Explorer, or:
rmdir /s /q protos

# Stage everything
git add IntanClient.ts main.ts fake-intan-service.ts deno.json .gitignore README.md
git add proto\api.proto proto\stimparam.proto

# Commit
git commit -m "feat: gRPC streamhaar, fake IntanService, no-DB, all critical fixes"

# Push
git push origin main
```

---

## Known limitations / next steps

- The LiveView **frontend** (HTML/JS) is not in this repo. It needs to connect
  to `ws://localhost:3000` and render the incoming `data` buffer as electrode
  traces — to be built as Project 1 continuation.
- `listenaftertrigger` and `listenaftertriggerspikes` are stubbed in the fake
  service. If the frontend uses spike-triggered averaging, these will need to be
  implemented once real hardware is available.
- TLS / authentication not implemented — assumed internal network deployment.

---

*FinalSpark — Intan Aggregator v2 | William Ashioya | February 2026*
