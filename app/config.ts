import {
  deepFreeze,
} from "utils";

export const happyColor = "#3cd348"; // light green
export const shockColor = "#f9321d"; // almost pure red
export const defaultColor = "#dadada"; // light grey

export const maxFps = 10;

export const shockDuration = 0.9; // in seconds

export const levels: Array<{
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
    missedOpportunityPenalty: 10,
    takenOpportunityPoints: 20,
  },
  { // level1
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 28,
    missedOpportunityPenalty: 6,
    takenOpportunityPoints: 12,
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
  { // level5
    timeLimit: 30,
    initialPoints: 30,
    shockPenalty: 31,
    missedOpportunityPenalty: 8,
    takenOpportunityPoints: 12,
  },
]);
