import {
  deepFreeze,
} from "utils";

export const levelConf: Array<{
    timeLimit: number, // in seconds
    initialPoints: number,
    shockPenalty: number, // per press
    missedOpportunityPenalty: number, // per second
    takenOpportunityPoints: number // per second
}> = deepFreeze([
  { // level0
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 27,
    missedOpportunityPenalty: 13,
    takenOpportunityPoints: 25,
  },
  { // level1
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 28,
    missedOpportunityPenalty: 8,
    takenOpportunityPoints: 14,
  },
  { // level2
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 10,
    missedOpportunityPenalty: 2,
    takenOpportunityPoints: 17,
  },
  { // level3
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 30,
    missedOpportunityPenalty: 8,
    takenOpportunityPoints: 12,
  },
  { // level4
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 31,
    missedOpportunityPenalty: 8,
    takenOpportunityPoints: 12,
  },
]);
