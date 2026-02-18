// Original file: protos/api.proto

import type { ChannelSpikeTimes as _api_ChannelSpikeTimes, ChannelSpikeTimes__Output as _api_ChannelSpikeTimes__Output } from '../api/ChannelSpikeTimes';
import type { ChannelSpikeAmplitudes as _api_ChannelSpikeAmplitudes, ChannelSpikeAmplitudes__Output as _api_ChannelSpikeAmplitudes__Output } from '../api/ChannelSpikeAmplitudes';
import type { Long } from '@grpc/proto-loader';

export interface TriggerSpikeWindow {
  'trigger'?: (number);
  'startTimeUs'?: (number | string | Long);
  'counts'?: (number)[];
  'spikeTimes'?: (_api_ChannelSpikeTimes)[];
  'maxAmplitudes'?: (number | string)[];
  'spikeAmplitudes'?: (_api_ChannelSpikeAmplitudes)[];
}

export interface TriggerSpikeWindow__Output {
  'trigger'?: (number);
  'startTimeUs'?: (Long);
  'counts'?: (number)[];
  'spikeTimes'?: (_api_ChannelSpikeTimes__Output)[];
  'maxAmplitudes'?: (number)[];
  'spikeAmplitudes'?: (_api_ChannelSpikeAmplitudes__Output)[];
}
