import { Application, Router, Context } from "https://deno.land/x/oak/mod.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { IntanClient } from "./IntanClient.ts";
import * as log from "https://deno.land/std/log/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const NUMBER_X_SAMPLE = 10;
const SIMULATED_MACHINES = 4;

await log.setup({
  handlers: { console: new log.ConsoleHandler("DEBUG"), file: new log.FileHandler("WARN", { filename: "./logs.txt" }) },
  loggers: { default: { level: "DEBUG", handlers: ["console", "file"] } },
});

const io = new Server({ cors: { origin: "*", methods: ["GET", "POST"] } });

const router = new Router();
const activeControllers: IntanClient[] = [];

const controllers = Array.from({ length: SIMULATED_MACHINES }, (_, i) => ({
  _id: `sim-${i}`,
  name: `MEA ${i + 1}`,
  address: `simulated-mea-${i + 1}:5051`,
  online: true,
  channels: [32],
  default_mea: i,
  default_electrodes: Array.from({ length: 32 }, (_, j) => j),
  recorded_file: "wavelet_signal.bin",
  recorded_nb_channels: 128,
  maintenance: false,
}));

controllers.forEach((ctrl, i) => {
  const client = new IntanClient(ctrl.address, ctrl._id);
  client.recorded_file = ctrl.recorded_file;
  client.recorded_nb_channels = ctrl.recorded_nb_channels;
  client.channels = ctrl.channels;
  client.startStreamData();
  activeControllers.push(client);

  client.onMaintenanceChange((status) => {
    log.debug(`Maintenance changed for ${ctrl.name}: ${status}`);
    io.emit("maintenance", { id_intan: ctrl._id, maintenance: status });
  });
});

router.get("/", (ctx) => { ctx.response.body = { message: "Intan Aggregator (Simulation Mode) - Ready" }; });

router.get("/controllers", (ctx) => {
  ctx.response.body = { 
    controllers: controllers.map((c, i) => ({
      ...c,
      channels: activeControllers[i]?.channels || c.channels,
      maintenance: activeControllers[i]?.maintenance || false,
    })) 
  };
});

router.get("/streams", (ctx) => {
  ctx.response.body = { status: "streaming", activeMachines: activeControllers.length };
});

io.on("connection", (socket) => {
  log.debug(`Client connected: ${socket.id}`);

  socket.on("start", (payload: any) => {
    if (!payload || typeof payload.id_intan !== "string") return;
    const client = activeControllers.find(c => c.id_intan === payload.id_intan);
    if (!client) return;

    let buffer: number[] = [];
    let count = 0;

    client.addCallback(socket.id, (data: number[]) => {
      buffer = buffer.concat(data);
      count++;
      if (count >= NUMBER_X_SAMPLE) {
        socket.emit("data", buffer);
        buffer = [];
        count = 0;
      }
    });
  });

  socket.on("disconnect", () => {
    activeControllers.forEach(c => c.removeCallback(socket.id));
  });
});

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

log.info("=== Intan Aggregator (No-DB Simulation Mode) STARTED ===");
log.info(`Simulating ${SIMULATED_MACHINES} machines | HTTP:8000 | Socket.IO:3000`);

app.listen({ port: 8000 });
await serve(io.handler(), { port: 3000 });

Deno.addSignalListener("SIGINT", () => {
  log.info("Shutting down gracefully...");
  activeControllers.forEach(c => c.stopStreamData());
  Deno.exit(0);
});