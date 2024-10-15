// Original file: protos/api.proto

export const Port = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
} as const;

export type Port =
  | 'A'
  | 0
  | 'B'
  | 1
  | 'C'
  | 2
  | 'D'
  | 3

export type Port__Output = typeof Port[keyof typeof Port]
