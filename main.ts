import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { IntanController, IntanChannel } from "./IntanController.ts";
import { IntanClient } from "./IntanClient.ts";
import * as log from "https://deno.land/std/log/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts"; 

// Constant
const NUMBER_X_SAMPLE = 10;

// Configure the logger
await log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG"),
    file: new log.FileHandler("WARN", {
      filename: "./logs.txt",
      formatter: "{datetime} {levelName} {msg}",
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console", "file"],
    },
  },
});

const io = new Server({
  cors: {
    origin: "*", // You can replace "*" with specific origins like "http://example.com"
    methods: ["GET", "POST"],
  },
});

const client = new MongoClient();
await client.connect("mongodb://intanagg:Rq3g25ihmXeK2Q8@172.30.1.43:27018/intanservice?authSource=intanservice");
const db = client.database("intanservice");
const controllersCollection = db.collection<IntanController>("controllers");

const router = new Router();

const activeControllers = new Array<IntanClient>();

router.get("/sample", (context) => {
  context.response.body = { numbersample: 160*NUMBER_X_SAMPLE };
});

let lock: Promise<void> | null = null;

router.get("/controllers", async (context) => {
  // Wait for the current lock to resolve if it exists
  while (lock) {
    await lock;
  }
  // Create a new lock for the current request
  let resolveLock: () => void;
  lock = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });

  try {
    const controllers: IntanController[] = await controllersCollection.find({}).toArray();

    // Use Promise.all to wait for all async operations inside the loop
    await Promise.all(controllers.map(async (controller) => {
      const existingControllerIndex = activeControllers.findIndex(activeController => 
        activeController.serverAddress === controller.address
      );

      if (controller.online) {
        if (existingControllerIndex === -1) {
          const grpcClient = new IntanClient(controller.address, controller._id.toString());
          await grpcClient.loadProtobuf();
          grpcClient.channels = await grpcClient.channelAvailable();
          if (grpcClient.channels.length == 0) {
            controller.online = false;
          } else {
            grpcClient.startStreamData();
            activeControllers.push(grpcClient);
          }
          controller.channels = grpcClient.channels;
        } else {
          controller.channels = activeControllers[existingControllerIndex].channels;
          activeControllers[existingControllerIndex].startStreamData();
        }
      } else {
        if (existingControllerIndex !== -1) {
          activeControllers[existingControllerIndex].stopStreamData();
          activeControllers.splice(existingControllerIndex, 1);
        }
      }

    }));

    // Now set the response body after all async operations are done
    context.response.body = { controllers };
  } finally {
    // Resolve the lock to allow the next request to proceed
    resolveLock();
    lock = null;
  }
});

router.get("/api", (context) => {
  context.response.body = { message: "Hello, REST API!" };
});

// let emitCount = 0;
// let startTime = Date.now();

// setInterval(() => {
//   const currentTime = Date.now();
//   const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
//   const emitRate = emitCount / elapsedTime; // Calculate emits per second
//   log.info(`Emit rate: ${emitRate.toFixed(2)} times per second`);
//   emitCount = 0; // Reset the counter
//   startTime = currentTime; // Reset the start time
// }, 5000); // 5 seconds interval

io.on("connection", (socket) => {
  log.debug(`socket ${socket.id} connected`);

  socket.on('start', (intan_chan: IntanChannel) => {
    const existingControllerIndex = activeControllers.findIndex(activeController => 
      activeController.id_intan === intan_chan.id_intan
    );
    if (existingControllerIndex >= 0) {
      const controller = activeControllers[existingControllerIndex];
      const total_channels = controller.channels.reduce((sum, channel) => sum + channel, 0);

      let accumulatedBuffer: number[][] = Array(intan_chan.channel_index.length).fill([]); // Initialize with empty arrays
      let accumulationCount = 0;

      controller.addCallback(socket.id, (data) => {
        const buffer_size_channel = data.length / total_channels;

        // Loop through the indices in intan_chan.channel_index
        intan_chan.channel_index.forEach((index, i) => {
          // Calculate the start and end of the data for this channel
          const start = index * buffer_size_channel;
          const end = start + buffer_size_channel;

          // Accumulate the data for this channel
          accumulatedBuffer[i] = accumulatedBuffer[i].concat(data.slice(start, end));
        });

        accumulationCount++;

        // Emit the accumulated buffer when accumulationCount reaches numberX
        if (accumulationCount >= NUMBER_X_SAMPLE) {
          socket.emit('data', accumulatedBuffer.flat());
          //emitCount++; // Increment the counter
          accumulatedBuffer = Array(intan_chan.channel_index.length).fill([]); // Reset the buffer
          accumulationCount = 0;  // Reset the count
        }
      });
    } else {
      log.error("Intan id not found");
    };
    
  });

  socket.on("disconnect", (reason) => {
    log.debug(`socket ${socket.id} disconnected due to ${reason}`);
    for (let i=0; i<activeControllers.length; i++) {
      activeControllers[i].removeCallback(socket.id);
    }
  });
});

const app = new Application();

// Apply CORS middleware
app.use(oakCors()); // Enable CORS for all routes

app.use(router.routes());
app.use(router.allowedMethods());

log.info("Server running on http://localhost:8000");
app.listen({ port: 8000 });
await serve(io.handler(), {
  port: 3000,
});
