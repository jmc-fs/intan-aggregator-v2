import { ObjectId } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

export interface IntanController {
    _id: ObjectId,
    address: string,
    name: string,
    online: boolean,
    channels: Array<number>,
    default_mea: number,
    default_electrodes: Array<number>,
    maintenance: boolean,
}

export interface IntanChannel {
    id_intan: string,
    channel_index: Array<number>
}