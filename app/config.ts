import {
  deepFreeze,
} from "utils";

export const levelConf: Array<{
    timeLimit: number,
    initialPoints: number,
    shockPenalty: number,
    missedOpportunityPenalty: number,
    takenOpportunityPoints: number
}> = deepFreeze([
  { // level0
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 27,
    missedOpportunityPenalty: 1.3,
    takenOpportunityPoints: 2.5,
  },
  { // level1
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 28,
    missedOpportunityPenalty: 0.8,
    takenOpportunityPoints: 1.4,
  },
  { // level2
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 10,
    missedOpportunityPenalty: 0.2,
    takenOpportunityPoints: 1.7,
  },
  { // level3
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 30,
    missedOpportunityPenalty: 0.8,
    takenOpportunityPoints: 1.2,
  },
  { // level4
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 31,
    missedOpportunityPenalty: 0.8,
    takenOpportunityPoints: 1.2,
  },
]);
