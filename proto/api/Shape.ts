// Original file: protos/stimparam.proto

export const Shape = {
  Biphasic: 0,
  BiphasicWithInterphaseDelay: 1,
  Triphasic: 2,
} as const;

export type Shape =
  | 'Biphasic'
  | 0
  | 'BiphasicWithInterphaseDelay'
  | 1
  | 'Triphasic'
  | 2

export type Shape__Output = typeof Shape[keyof typeof Shape]
