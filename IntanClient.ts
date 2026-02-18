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
    private healthCheckIntervalId: any = null;

    serverAddress: string;
    id_intan: string;
    channels = new Array<number>();
    maintenance = false;
    online = true;
    recorded_file = "";
    recorded_nb_channels = 0;

    private maintenanceCallbacks: Array<(status: boolean) => void> = [];

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
                    log.error(`channelAvailable: ${err}`);
                    resolve(new Array<number>());
                } else {
                    resolve(response.channels);
                }
            });
        });
    }

    private startHealthCheck(interval: number = 10000) {
        if (this.healthCheckIntervalId) return;
        this.healthCheckIntervalId = setInterval(async () => {
            try {
                const channels = await this.channelAvailable();
                if (!channels.length) {
                    log.debug(`Health check failed: No channels for ${this.serverAddress} (${this.id_intan})`);
                    this.setMaintenance(true);
                    this.stopStreamData();
                    this.streamRecordedData();
                }
            } catch (err) {
                log.error(`Health check error for ${this.serverAddress} (${this.id_intan}): ${err?.stack || err}`);
                this.online = false;
                this.stopStreamData();
            }
        }, interval);
    }

    private stopHealthCheck() {
        if (this.healthCheckIntervalId) {
            clearInterval(this.healthCheckIntervalId);
            this.healthCheckIntervalId = null;
        }
    }

    startStreamData() {
        if (this.isStartStream)
            return;
        this.isStartStream = true;
        if (this.stream === null) {
            const channels = new Array<number>();
            for (let i = 0; i < this.channels.length; i++) {
                for (let j = 0; j < this.channels[i]; j++) {
                    channels.push(j + i * this.channels[i]);
                }
            }
            const request: ChannelsArray = { channels };
            try {
                this.stream = this.client.streamhaar(request, {});
                log.info(`Start Stream ${this.serverAddress} connected`);

                this.startHealthCheck(); // Start health check when stream starts

                this.stream.on('data', (chunk: FloatArrayChunk) => {
                    try {
                        if (Array.isArray(chunk.data)) {
                            const filteredData = chunk.data.filter((item): item is number => typeof item === 'number');
                            this.onDataCallbacks.forEach(({ callback }) => callback(filteredData));
                        }
                    } catch (err) {
                        log.error(`Error in data handler for ${this.serverAddress}: ${err?.stack || err}`);
                    }
                });

                this.stream.on('error', (err: Error) => {
                    if (err.message && err.message.includes('CANCELLED: Cancelled on client')) {
                        log.info(`Stream cancelled by client for ${this.serverAddress} (${this.id_intan})`);
                    } else {
                        log.error(`stream error on ${this.serverAddress} (${this.id_intan}): ${err?.stack || err}`);
                    }
                    this.stopStreamData();
                });

                this.stream.on('end', () => {
                    log.info(`Stream ended for ${this.serverAddress}`);
                    this.stopStreamData();
                });
            } catch (err) {
                throw new Error(
                    `IntanClient stream error for ${this.serverAddress} (${this.id_intan}): ${err?.stack || err}`
                );
            }
        }
        this.isStartStream = false;
    }

    async readFloat32Array(filePath: string): Promise<Float32Array> {
        const buf = await Deno.readFile(filePath);
        return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    }

    async streamRecordedData() {
        await this.streamDataFromFile(this.recorded_file, 23.4, this.recorded_nb_channels);
    }

    private async streamDataFromFile(filePath: string, interval: number = 1000, nb_channel: number = 32) {
        if (this.isStartStream) return;
        this.isStartStream = true;

        const data = await Deno.readFile(filePath);
        const floatData = new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4);
        const channel_length = floatData.length / nb_channel;
        const chunkSizePerChannel = 160;

        let offset = 0;
        const sendChunk = () => {
            if (offset + chunkSizePerChannel > channel_length) offset = 0; // Loop if at end

            // Gather chunkSizePerChannel samples from each channel
            const chunk: number[] = [];
            for (let ch = 0; ch < nb_channel; ch++) {
                const channelOffset = ch * channel_length + offset;
                const channelData = floatData.subarray(channelOffset, channelOffset + chunkSizePerChannel);
                chunk.push(...channelData);
            }

            this.onDataCallbacks.forEach(({ callback }) => callback(chunk));
            offset += chunkSizePerChannel;
        };

        const intervalId = setInterval(sendChunk, interval);
        this.stream = { cancel: () => clearInterval(intervalId) };
        log.info(`File data stream started for ${this.serverAddress}`);
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
        this.stopHealthCheck(); // Stop health check when stream stops
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
}
