export interface DeregisterFun { (): void; };

let gameLoopTimeoutId: number;
let stopRequested: boolean = false;
/**
 * @param gameLoop a function that gets deltaT passed in
 * @return a function to stop the gameloop.
 */
export function runGameLoop(
  gameLoop: (
    deltaT: number,
    stopGameLoop: (() => void)
  ) => any,
  maxFps: number
): (() => void) {
// ): DregisterFun {
  const deltaT = getDeltaT();
  const frameStart = Date.now();

  // if set to true due to caller or
  // the gameLoop-Function using
  // the unregister/stop-callback
  // the timeout won't be requeued
  stopRequested = false;

  /*
   * All the game-logic around scoring and GUI-updates
   */
  gameLoop(deltaT, stopGameLoop);


  /*
   * requeue next update with variable delay to get capped fps
   */
  let waitDuration;
  if (maxFps) {
    const frameEnd = Date.now();
    const frameDuration = frameEnd - frameStart;
    const framePlusWait = 1000 / maxFps;
    waitDuration =  framePlusWait - frameDuration;
    waitDuration = Math.max(0, waitDuration); // for maxFps === 10: limit to 0-100ms, i.e. <10fps
  } else {
    waitDuration = 0;
  }

  if (!stopRequested) {
    gameLoopTimeoutId = setTimeout(
      () => runGameLoop(gameLoop, maxFps),
      waitDuration
    );
  }

  // uregister; will use the latest gameLoopTimeoutId
  return stopGameLoop;
}

function stopGameLoop() {
  clearTimeout(gameLoopTimeoutId);
  stopRequested = true;
}

let previousUpdateTime;
function getDeltaT(): number {
  const currentTime = Date.now();
  if (!previousUpdateTime) {
    previousUpdateTime = currentTime;
  }
  const deltaT = currentTime - previousUpdateTime;
  previousUpdateTime = Date.now();

  return deltaT;
}
