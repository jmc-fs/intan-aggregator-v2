// Original file: protos/api.proto

import type { Long } from '@grpc/proto-loader';

export interface ChannelSpikeTimes {
  'channel'?: (number);
  'timestampsUs'?: (number | string | Long)[];
}

export interface ChannelSpikeTimes__Output {
  'channel'?: (number);
  'timestampsUs'?: (Long)[];
}
