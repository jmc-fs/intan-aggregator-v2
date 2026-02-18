// Original file: protos/api.proto

import type { Long } from '@grpc/proto-loader';

export interface TriggerWindowChunk {
  'trigger'?: (number);
  'startTimeUs'?: (number | string | Long);
  'samplesPerChannel'?: (number);
  'totalChannels'?: (number);
  'data'?: (number | string)[];
}

export interface TriggerWindowChunk__Output {
  'trigger'?: (number);
  'startTimeUs'?: (Long);
  'samplesPerChannel'?: (number);
  'totalChannels'?: (number);
  'data'?: (number)[];
}
