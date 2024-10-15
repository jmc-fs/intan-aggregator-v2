// Original file: protos/stimparam.proto

import type { Shape as _api_Shape, Shape__Output as _api_Shape__Output } from '../api/Shape';
import type { Polarity as _api_Polarity, Polarity__Output as _api_Polarity__Output } from '../api/Polarity';
import type { TriggerEdgeOrLevel as _api_TriggerEdgeOrLevel, TriggerEdgeOrLevel__Output as _api_TriggerEdgeOrLevel__Output } from '../api/TriggerEdgeOrLevel';
import type { TriggerHighOrLow as _api_TriggerHighOrLow, TriggerHighOrLow__Output as _api_TriggerHighOrLow__Output } from '../api/TriggerHighOrLow';
import type { PulseOrTrain as _api_PulseOrTrain, PulseOrTrain__Output as _api_PulseOrTrain__Output } from '../api/PulseOrTrain';

export interface StimParam {
  'channel'?: (number);
  'shape'?: (_api_Shape);
  'polarity'?: (_api_Polarity);
  'source'?: (number);
  'triggeredgeorlevel'?: (_api_TriggerEdgeOrLevel);
  'triggerhighorlow'?: (_api_TriggerHighOrLow);
  'pulse'?: (_api_PulseOrTrain);
  'stimenabled'?: (boolean);
  'maintainampsettle'?: (boolean);
  'enableampsettle'?: (boolean);
  'enablechargerecovery'?: (boolean);
  'firstphasedurationmicroseconds'?: (number | string);
  'secondphasedurationmicroseconds'?: (number | string);
  'interphasedelaymicroseconds'?: (number | string);
  'firstphaseamplitudemicroamps'?: (number | string);
  'secondphaseamplitudemicroamps'?: (number | string);
  'posttriggerdelaymicroseconds'?: (number | string);
  'pulsetrainperiodmicroseconds'?: (number | string);
  'refractoryperiodmicroseconds'?: (number | string);
  'prestimampsettlemicroseconds'?: (number | string);
  'poststimampsettlemicroseconds'?: (number | string);
  'poststimchargerecovonmicroseconds'?: (number | string);
  'poststimchargerecovoffmicroseconds'?: (number | string);
  'numberofstimpulses'?: (number);
  '_shape'?: "shape";
  '_polarity'?: "polarity";
  '_source'?: "source";
  '_triggeredgeorlevel'?: "triggeredgeorlevel";
  '_triggerhighorlow'?: "triggerhighorlow";
  '_pulse'?: "pulse";
  '_stimenabled'?: "stimenabled";
  '_maintainampsettle'?: "maintainampsettle";
  '_enableampsettle'?: "enableampsettle";
  '_enablechargerecovery'?: "enablechargerecovery";
  '_firstphasedurationmicroseconds'?: "firstphasedurationmicroseconds";
  '_secondphasedurationmicroseconds'?: "secondphasedurationmicroseconds";
  '_interphasedelaymicroseconds'?: "interphasedelaymicroseconds";
  '_firstphaseamplitudemicroamps'?: "firstphaseamplitudemicroamps";
  '_secondphaseamplitudemicroamps'?: "secondphaseamplitudemicroamps";
  '_posttriggerdelaymicroseconds'?: "posttriggerdelaymicroseconds";
  '_pulsetrainperiodmicroseconds'?: "pulsetrainperiodmicroseconds";
  '_refractoryperiodmicroseconds'?: "refractoryperiodmicroseconds";
  '_prestimampsettlemicroseconds'?: "prestimampsettlemicroseconds";
  '_poststimampsettlemicroseconds'?: "poststimampsettlemicroseconds";
  '_poststimchargerecovonmicroseconds'?: "poststimchargerecovonmicroseconds";
  '_poststimchargerecovoffmicroseconds'?: "poststimchargerecovoffmicroseconds";
  '_numberofstimpulses'?: "numberofstimpulses";
}

export interface StimParam__Output {
  'channel'?: (number);
  'shape'?: (_api_Shape__Output);
  'polarity'?: (_api_Polarity__Output);
  'source'?: (number);
  'triggeredgeorlevel'?: (_api_TriggerEdgeOrLevel__Output);
  'triggerhighorlow'?: (_api_TriggerHighOrLow__Output);
  'pulse'?: (_api_PulseOrTrain__Output);
  'stimenabled'?: (boolean);
  'maintainampsettle'?: (boolean);
  'enableampsettle'?: (boolean);
  'enablechargerecovery'?: (boolean);
  'firstphasedurationmicroseconds'?: (number);
  'secondphasedurationmicroseconds'?: (number);
  'interphasedelaymicroseconds'?: (number);
  'firstphaseamplitudemicroamps'?: (number);
  'secondphaseamplitudemicroamps'?: (number);
  'posttriggerdelaymicroseconds'?: (number);
  'pulsetrainperiodmicroseconds'?: (number);
  'refractoryperiodmicroseconds'?: (number);
  'prestimampsettlemicroseconds'?: (number);
  'poststimampsettlemicroseconds'?: (number);
  'poststimchargerecovonmicroseconds'?: (number);
  'poststimchargerecovoffmicroseconds'?: (number);
  'numberofstimpulses'?: (number);
}
