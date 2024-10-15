// Original file: protos/stimparam.proto

export const PulseOrTrain = {
  SinglePulse: 0,
  PulseTrain: 1,
} as const;

export type PulseOrTrain =
  | 'SinglePulse'
  | 0
  | 'PulseTrain'
  | 1

export type PulseOrTrain__Output = typeof PulseOrTrain[keyof typeof PulseOrTrain]
