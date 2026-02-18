// Original file: protos/api.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { ChannelsArray as _api_ChannelsArray, ChannelsArray__Output as _api_ChannelsArray__Output } from '../api/ChannelsArray';
import type { CoefThresholds as _api_CoefThresholds, CoefThresholds__Output as _api_CoefThresholds__Output } from '../api/CoefThresholds';
import type { CountArray as _api_CountArray, CountArray__Output as _api_CountArray__Output } from '../api/CountArray';
import type { DebugInfo as _api_DebugInfo, DebugInfo__Output as _api_DebugInfo__Output } from '../api/DebugInfo';
import type { DurationCount as _api_DurationCount, DurationCount__Output as _api_DurationCount__Output } from '../api/DurationCount';
import type { Empty as _api_Empty, Empty__Output as _api_Empty__Output } from '../api/Empty';
import type { ExpNames as _api_ExpNames, ExpNames__Output as _api_ExpNames__Output } from '../api/ExpNames';
import type { FloatArrayChunk as _api_FloatArrayChunk, FloatArrayChunk__Output as _api_FloatArrayChunk__Output } from '../api/FloatArrayChunk';
import type { SaveInfo as _api_SaveInfo, SaveInfo__Output as _api_SaveInfo__Output } from '../api/SaveInfo';
import type { StatusReply as _api_StatusReply, StatusReply__Output as _api_StatusReply__Output } from '../api/StatusReply';
import type { StimParam as _api_StimParam, StimParam__Output as _api_StimParam__Output } from '../api/StimParam';
import type { TriggerSpikeRequest as _api_TriggerSpikeRequest, TriggerSpikeRequest__Output as _api_TriggerSpikeRequest__Output } from '../api/TriggerSpikeRequest';
import type { TriggerSpikeWindow as _api_TriggerSpikeWindow, TriggerSpikeWindow__Output as _api_TriggerSpikeWindow__Output } from '../api/TriggerSpikeWindow';
import type { TriggerWindowChunk as _api_TriggerWindowChunk, TriggerWindowChunk__Output as _api_TriggerWindowChunk__Output } from '../api/TriggerWindowChunk';
import type { TriggerWindowRequest as _api_TriggerWindowRequest, TriggerWindowRequest__Output as _api_TriggerWindowRequest__Output } from '../api/TriggerWindowRequest';
import type { TriggersInfo as _api_TriggersInfo, TriggersInfo__Output as _api_TriggersInfo__Output } from '../api/TriggersInfo';
import type { VarThresholds as _api_VarThresholds, VarThresholds__Output as _api_VarThresholds__Output } from '../api/VarThresholds';

export interface IntanServiceClient extends grpc.Client {
  channelavailable(argument: _api_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_ChannelsArray__Output>): grpc.ClientUnaryCall;
  channelavailable(argument: _api_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_ChannelsArray__Output>): grpc.ClientUnaryCall;
  channelavailable(argument: _api_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_api_ChannelsArray__Output>): grpc.ClientUnaryCall;
  channelavailable(argument: _api_Empty, callback: grpc.requestCallback<_api_ChannelsArray__Output>): grpc.ClientUnaryCall;
  
  coefthresholds(argument: _api_CoefThresholds, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  coefthresholds(argument: _api_CoefThresholds, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  coefthresholds(argument: _api_CoefThresholds, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  coefthresholds(argument: _api_CoefThresholds, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  count(argument: _api_DurationCount, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_CountArray__Output>): grpc.ClientUnaryCall;
  count(argument: _api_DurationCount, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_CountArray__Output>): grpc.ClientUnaryCall;
  count(argument: _api_DurationCount, options: grpc.CallOptions, callback: grpc.requestCallback<_api_CountArray__Output>): grpc.ClientUnaryCall;
  count(argument: _api_DurationCount, callback: grpc.requestCallback<_api_CountArray__Output>): grpc.ClientUnaryCall;
  
  debuginfo(argument: _api_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_DebugInfo__Output>): grpc.ClientUnaryCall;
  debuginfo(argument: _api_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_DebugInfo__Output>): grpc.ClientUnaryCall;
  debuginfo(argument: _api_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_api_DebugInfo__Output>): grpc.ClientUnaryCall;
  debuginfo(argument: _api_Empty, callback: grpc.requestCallback<_api_DebugInfo__Output>): grpc.ClientUnaryCall;
  
  disableallstim(argument: _api_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  disableallstim(argument: _api_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  disableallstim(argument: _api_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  disableallstim(argument: _api_Empty, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  expname(argument: _api_ExpNames, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  expname(argument: _api_ExpNames, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  expname(argument: _api_ExpNames, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  expname(argument: _api_ExpNames, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  listenaftertrigger(argument: _api_TriggerWindowRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_api_TriggerWindowChunk__Output>;
  listenaftertrigger(argument: _api_TriggerWindowRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_api_TriggerWindowChunk__Output>;
  
  listenaftertriggerspikes(argument: _api_TriggerSpikeRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_api_TriggerSpikeWindow__Output>;
  listenaftertriggerspikes(argument: _api_TriggerSpikeRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_api_TriggerSpikeWindow__Output>;
  
  start(argument: _api_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  start(argument: _api_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  start(argument: _api_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  start(argument: _api_Empty, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  startrecording(argument: _api_SaveInfo, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  startrecording(argument: _api_SaveInfo, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  startrecording(argument: _api_SaveInfo, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  startrecording(argument: _api_SaveInfo, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  stimparam(argument: _api_StimParam, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stimparam(argument: _api_StimParam, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stimparam(argument: _api_StimParam, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stimparam(argument: _api_StimParam, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  stop(argument: _api_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stop(argument: _api_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stop(argument: _api_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stop(argument: _api_Empty, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  stoprecording(argument: _api_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stoprecording(argument: _api_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stoprecording(argument: _api_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  stoprecording(argument: _api_Empty, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  streamhaar(argument: _api_ChannelsArray, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_api_FloatArrayChunk__Output>;
  streamhaar(argument: _api_ChannelsArray, options?: grpc.CallOptions): grpc.ClientReadableStream<_api_FloatArrayChunk__Output>;
  
  triggertags(argument: _api_TriggersInfo, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  triggertags(argument: _api_TriggersInfo, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  triggertags(argument: _api_TriggersInfo, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  triggertags(argument: _api_TriggersInfo, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  updatestimparam(argument: _api_ChannelsArray, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  updatestimparam(argument: _api_ChannelsArray, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  updatestimparam(argument: _api_ChannelsArray, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  updatestimparam(argument: _api_ChannelsArray, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
  varthreshold(argument: _api_VarThresholds, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  varthreshold(argument: _api_VarThresholds, metadata: grpc.Metadata, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  varthreshold(argument: _api_VarThresholds, options: grpc.CallOptions, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  varthreshold(argument: _api_VarThresholds, callback: grpc.requestCallback<_api_StatusReply__Output>): grpc.ClientUnaryCall;
  
}

export interface IntanServiceHandlers extends grpc.UntypedServiceImplementation {
  channelavailable: grpc.handleUnaryCall<_api_Empty__Output, _api_ChannelsArray>;
  
  coefthresholds: grpc.handleUnaryCall<_api_CoefThresholds__Output, _api_StatusReply>;
  
  count: grpc.handleUnaryCall<_api_DurationCount__Output, _api_CountArray>;
  
  debuginfo: grpc.handleUnaryCall<_api_Empty__Output, _api_DebugInfo>;
  
  disableallstim: grpc.handleUnaryCall<_api_Empty__Output, _api_StatusReply>;
  
  expname: grpc.handleUnaryCall<_api_ExpNames__Output, _api_StatusReply>;
  
  listenaftertrigger: grpc.handleServerStreamingCall<_api_TriggerWindowRequest__Output, _api_TriggerWindowChunk>;
  
  listenaftertriggerspikes: grpc.handleServerStreamingCall<_api_TriggerSpikeRequest__Output, _api_TriggerSpikeWindow>;
  
  start: grpc.handleUnaryCall<_api_Empty__Output, _api_StatusReply>;
  
  startrecording: grpc.handleUnaryCall<_api_SaveInfo__Output, _api_StatusReply>;
  
  stimparam: grpc.handleUnaryCall<_api_StimParam__Output, _api_StatusReply>;
  
  stop: grpc.handleUnaryCall<_api_Empty__Output, _api_StatusReply>;
  
  stoprecording: grpc.handleUnaryCall<_api_Empty__Output, _api_StatusReply>;
  
  streamhaar: grpc.handleServerStreamingCall<_api_ChannelsArray__Output, _api_FloatArrayChunk>;
  
  triggertags: grpc.handleUnaryCall<_api_TriggersInfo__Output, _api_StatusReply>;
  
  updatestimparam: grpc.handleUnaryCall<_api_ChannelsArray__Output, _api_StatusReply>;
  
  varthreshold: grpc.handleUnaryCall<_api_VarThresholds__Output, _api_StatusReply>;
  
}

export interface IntanServiceDefinition extends grpc.ServiceDefinition {
  channelavailable: MethodDefinition<_api_Empty, _api_ChannelsArray, _api_Empty__Output, _api_ChannelsArray__Output>
  coefthresholds: MethodDefinition<_api_CoefThresholds, _api_StatusReply, _api_CoefThresholds__Output, _api_StatusReply__Output>
  count: MethodDefinition<_api_DurationCount, _api_CountArray, _api_DurationCount__Output, _api_CountArray__Output>
  debuginfo: MethodDefinition<_api_Empty, _api_DebugInfo, _api_Empty__Output, _api_DebugInfo__Output>
  disableallstim: MethodDefinition<_api_Empty, _api_StatusReply, _api_Empty__Output, _api_StatusReply__Output>
  expname: MethodDefinition<_api_ExpNames, _api_StatusReply, _api_ExpNames__Output, _api_StatusReply__Output>
  listenaftertrigger: MethodDefinition<_api_TriggerWindowRequest, _api_TriggerWindowChunk, _api_TriggerWindowRequest__Output, _api_TriggerWindowChunk__Output>
  listenaftertriggerspikes: MethodDefinition<_api_TriggerSpikeRequest, _api_TriggerSpikeWindow, _api_TriggerSpikeRequest__Output, _api_TriggerSpikeWindow__Output>
  start: MethodDefinition<_api_Empty, _api_StatusReply, _api_Empty__Output, _api_StatusReply__Output>
  startrecording: MethodDefinition<_api_SaveInfo, _api_StatusReply, _api_SaveInfo__Output, _api_StatusReply__Output>
  stimparam: MethodDefinition<_api_StimParam, _api_StatusReply, _api_StimParam__Output, _api_StatusReply__Output>
  stop: MethodDefinition<_api_Empty, _api_StatusReply, _api_Empty__Output, _api_StatusReply__Output>
  stoprecording: MethodDefinition<_api_Empty, _api_StatusReply, _api_Empty__Output, _api_StatusReply__Output>
  streamhaar: MethodDefinition<_api_ChannelsArray, _api_FloatArrayChunk, _api_ChannelsArray__Output, _api_FloatArrayChunk__Output>
  triggertags: MethodDefinition<_api_TriggersInfo, _api_StatusReply, _api_TriggersInfo__Output, _api_StatusReply__Output>
  updatestimparam: MethodDefinition<_api_ChannelsArray, _api_StatusReply, _api_ChannelsArray__Output, _api_StatusReply__Output>
  varthreshold: MethodDefinition<_api_VarThresholds, _api_StatusReply, _api_VarThresholds__Output, _api_StatusReply__Output>
}
