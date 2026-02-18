import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { IntanServiceClient as _api_IntanServiceClient, IntanServiceDefinition as _api_IntanServiceDefinition } from './api/IntanService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  api: {
    ChannelSpikeAmplitudes: MessageTypeDefinition
    ChannelSpikeTimes: MessageTypeDefinition
    ChannelsArray: MessageTypeDefinition
    CoefThreshold: MessageTypeDefinition
    CoefThresholds: MessageTypeDefinition
    CountArray: MessageTypeDefinition
    DebugInfo: MessageTypeDefinition
    DurationCount: MessageTypeDefinition
    Empty: MessageTypeDefinition
    ExpName: MessageTypeDefinition
    ExpNames: MessageTypeDefinition
    FloatArrayChunk: MessageTypeDefinition
    IntanService: SubtypeConstructor<typeof grpc.Client, _api_IntanServiceClient> & { service: _api_IntanServiceDefinition }
    Polarity: EnumTypeDefinition
    Port: EnumTypeDefinition
    PulseOrTrain: EnumTypeDefinition
    SaveInfo: MessageTypeDefinition
    Shape: EnumTypeDefinition
    StatusReply: MessageTypeDefinition
    StimParam: MessageTypeDefinition
    TriggerEdgeOrLevel: EnumTypeDefinition
    TriggerHighOrLow: EnumTypeDefinition
    TriggerSpikeRequest: MessageTypeDefinition
    TriggerSpikeWindow: MessageTypeDefinition
    TriggerWindowChunk: MessageTypeDefinition
    TriggerWindowRequest: MessageTypeDefinition
    TriggersInfo: MessageTypeDefinition
    VarThreshold: MessageTypeDefinition
    VarThresholds: MessageTypeDefinition
  }
}

