// Original file: protos/stimparam.proto

export const TriggerEdgeOrLevel = {
  Edge: 0,
  Level: 1,
} as const;

export type TriggerEdgeOrLevel =
  | 'Edge'
  | 0
  | 'Level'
  | 1

export type TriggerEdgeOrLevel__Output = typeof TriggerEdgeOrLevel[keyof typeof TriggerEdgeOrLevel]
