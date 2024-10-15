// Original file: protos/stimparam.proto

export const Polarity = {
  NegativeFirst: 0,
  PositiveFirst: 1,
} as const;

export type Polarity =
  | 'NegativeFirst'
  | 0
  | 'PositiveFirst'
  | 1

export type Polarity__Output = typeof Polarity[keyof typeof Polarity]
