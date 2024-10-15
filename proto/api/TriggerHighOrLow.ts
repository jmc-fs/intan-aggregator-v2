// Original file: protos/stimparam.proto

export const TriggerHighOrLow = {
  High: 0,
  Low: 1,
} as const;

export type TriggerHighOrLow =
  | 'High'
  | 0
  | 'Low'
  | 1

export type TriggerHighOrLow__Output = typeof TriggerHighOrLow[keyof typeof TriggerHighOrLow]
