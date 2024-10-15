import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  api: {
    Polarity: EnumTypeDefinition
    PulseOrTrain: EnumTypeDefinition
    Shape: EnumTypeDefinition
    StimParam: MessageTypeDefinition
    TriggerEdgeOrLevel: EnumTypeDefinition
    TriggerHighOrLow: EnumTypeDefinition
  }
}

