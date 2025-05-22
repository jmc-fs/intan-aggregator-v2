import { join } from "https://deno.land/x/oak@v16.1.0/deps.ts";
import { credentials, GrpcObject, loadPackageDefinition } from "npm:@grpc/grpc-js";
import * as protoLoader from "npm:@grpc/proto-loader";
import { IntanServiceClient } from "./proto/api/IntanService.ts";
import { ChannelsArray } from "./proto/api/ChannelsArray.ts";
import { FloatArrayChunk } from "./proto/api/FloatArrayChunk.ts";
import * as log from "https://deno.land/std/log/mod.ts";

export class IntanClient {
    private protoDef!: GrpcObject;
    private client!: IntanServiceClient;
    private onDataCallbacks: Array<{ id: string, callback: (data: Array<number>) => void }> = [];
    private stream: any;
    private isStartStream = false;

    serverAddress: string;
    id_intan: string;
    channels = new Array<number>();
    maintenance = false;

    constructor(serverAddress: string, idmea: string) {
        this.serverAddress = serverAddress;
        this.id_intan = idmea;
        this.stream = null;
    }

    async loadProtobuf() {
        const protoDir = new URL("./protos/", import.meta.url).pathname; // Get the directory path
        const protoFiles = await Deno.readDir(protoDir);
        const packageDefinitions = [];
    
        for await (const file of protoFiles) {
            if (file.name.endsWith(".proto")) {
                const filePath = join(protoDir, file.name);
                const packageDefinition = protoLoader.loadSync(filePath); // Load and parse the .proto file
                packageDefinitions.push(packageDefinition);
            }
        }
    
        this.protoDef = loadPackageDefinition(Object.assign({}, ...packageDefinitions));
        this.client = new this.protoDef.api.IntanService(
            this.serverAddress,
            credentials.createInsecure(),
        ) as IntanServiceClient;
    }

    channelAvailable(): Promise<Array<number>> {
        return new Promise((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 5); // Set a 5-second timeout

            this.client.channelavailable({}, { deadline }, (err, response) => {
                if (err) {
                    log.error('channelAvailable:',err);
                    resolve(new Array<number>());
                } else {
                    resolve(response.channels);
                }
            });
        });
    }

    startStreamData() {
        if (this.isStartStream)
            return;
        this.isStartStream = true;
        if (this.stream === null) {
            const channels = new Array<number>();
            for (let i = 0; i<this.channels.length; i++) {
                for (let j=0; j<this.channels[i]; j++) {
                    channels.push(j+i*this.channels[i]);
                }
            }
            const request: ChannelsArray = {
                channels: channels
            };
            this.stream = this.client.streamhaar(request, {});
            log.info(`Start Stream ${this.serverAddress} connected`);
            this.stream.on('data', (chunk: FloatArrayChunk) => {
                
                if (Array.isArray(chunk.data)) {
                    const filteredData = chunk.data.filter((item): item is number => typeof item === 'number');
                    this.onDataCallbacks.forEach(({ callback }) => callback(filteredData));
                }
            });

            this.stream.on('error', (err: Error) => {
                log.error('stream error:', this.serverAddress, err);
            })
        }
        this.isStartStream = false;
    }

    generateRandomDataStream(interval: number = 1000, numberOfChannels: number = 32) {
        if (this.isStartStream)
            return;
        this.isStartStream = true;
    
        const generateData = () => {
            const randomData = Array.from({ length: 160*numberOfChannels }, () => (Math.random()-0.5) * 100); // Generate 100 random numbers
            this.onDataCallbacks.forEach(({ callback }) => callback(randomData));
        };
    
        const intervalId = setInterval(generateData, interval);
    
        // Store the intervalId to clear it later
        this.stream = {
            cancel: () => clearInterval(intervalId)
        };
    
        log.info(`Random data stream started for ${this.serverAddress}`);
        this.isStartStream = false;
    }

    addCallback(id: string, callback: (data: Array<number>) => void) {
        // Check if the id already exists
        const existingIndex = this.onDataCallbacks.findIndex(cb => cb.id === id);

        if (existingIndex >= 0) {
            // If the id exists, replace the existing callback
            this.onDataCallbacks[existingIndex].callback = callback;
        } else {
            // If the id does not exist, add a new callback
            this.onDataCallbacks.push({ id, callback });
        }
    }

    removeCallback(id: string) {
        this.onDataCallbacks = this.onDataCallbacks.filter(cb => cb.id !== id);
    }

    stopStreamData() {
        if (this.stream) {
            this.stream.cancel(); // Close the stream
            this.stream = null; // Clear the stream reference
        }
    }
}
