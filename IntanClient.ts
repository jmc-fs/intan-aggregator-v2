import * as log from "https://deno.land/std/log/mod.ts";

export class IntanClient {
  id_intan: string;
  serverAddress: string;
  channels: number[] = [];
  maintenance = false;
  recorded_file = "";
  recorded_nb_channels = 0;

  private onDataCallbacks: Array<{ id: string; callback: (data: number[]) => void }> = [];
  private stream: any = null;
  private isStartStream = false;
  private maintenanceCallbacks: Array<(status: boolean) => void> = [];
  private spikeCount = 0;

  constructor(serverAddress: string, idmea: string) {
    this.serverAddress = serverAddress;
    this.id_intan = idmea;
  }

  startStreamData() {
    if (this.isStartStream) return;
    this.isStartStream = true;
    this.streamRecordedData();
  }

  private async streamRecordedData() {
    try {
      const data = await Deno.readFile(this.recorded_file);

      // No file size limit — file may be large, Deno handles it fine

      // Math.floor prevents RangeError when file size is not a multiple of 4 bytes
      const floatData = new Float32Array(
        data.buffer,
        data.byteOffset,
        Math.floor(data.byteLength / 4)
      );

      const nb_channel = this.recorded_nb_channels || 128;
      const channel_length = Math.floor(floatData.length / nb_channel);
      const chunkSize = 160;
      let offset = 0;

      const sendChunk = () => {
        // FIX 3: reset offset when we reach the end (loop the file)
        if (offset + chunkSize > channel_length) offset = 0;

        const chunk: number[] = [];
        for (let ch = 0; ch < nb_channel; ch++) {
          const start = ch * channel_length + offset;
          chunk.push(...floatData.subarray(start, start + chunkSize));
        }

        // FIX 3: actually advance offset so we don't replay the same samples forever
        offset += chunkSize;

        this.spikeCount = chunk.filter(v => Math.abs(v) > 50).length;
        if (this.spikeCount > 800) this.setMaintenance(true);
        this.onDataCallbacks.forEach(({ callback }) => callback(chunk));
      };

      // FIX 2: start the interval immediately and store the ID for cancel()
      // (previously the interval was only created inside cancel(), so it never ran)
      const intervalId = setInterval(sendChunk, 1000);
      this.stream = { cancel: () => clearInterval(intervalId) };

      log.info(
        `[${this.id_intan}] Streaming from file: ${this.recorded_file} ` +
        `(${floatData.length} samples, ${nb_channel} channels)`
      );
    } catch (e) {
      log.warn(`[${this.id_intan}] Recorded file error - using random data`);
      log.error(`[${this.id_intan}] ACTUAL ERROR: ${e}`);
      this.generateRandomDataStream();
    }
  }

  private generateRandomDataStream() {
    const intervalId = setInterval(() => {
      const randomData = Array.from(
        { length: 160 * 32 },
        () => (Math.random() - 0.5) * 100
      );
      this.spikeCount = randomData.filter(v => Math.abs(v) > 50).length;
      if (this.spikeCount > 800) this.setMaintenance(true);
      this.onDataCallbacks.forEach(({ callback }) => callback(randomData));
    }, 1000);
    this.stream = { cancel: () => clearInterval(intervalId) };
  }

  addCallback(id: string, callback: (data: number[]) => void) {
    this.onDataCallbacks.push({ id, callback });
  }

  removeCallback(id: string) {
    this.onDataCallbacks = this.onDataCallbacks.filter(c => c.id !== id);
  }

  stopStreamData() {
    if (this.stream) this.stream.cancel();
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