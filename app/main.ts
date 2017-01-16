// custom declarations / headers
/// <reference path="declarations.d.ts"/>

// declarations/headers installed via `./node_modules/.bin/typings install <pkg>`
///// <reference path="../typings/index.d.ts"/>

// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

import {
  toPoints,
} from "svg-points";

import {
  piecesAt,
  selectAttachedLines,
  attached,
  attachedToShape,
  insideShape,
  insideRect,
} from "geometry";

import {
  isPowered,
  pathToGenerator,
} from "is-powered";

import {
  loadMap,
  fetchSvg,
} from "fetch-map";

import {
  runGameLoop
} from "run-game-loop";

// import Immutable from "immutable";

// import "wout/svg.js";
// import SVG from "jspm_packages/svg.js@2.3.6/svg.js.d.ts";

import {
  svgElementsAt,
} from "svg-elements-at";

import {
  hasJSType,
  contains,
  markCoords,
  markCoordsLive,
  getIn,
  delay,
  deepFreeze,
  filterSet,
  makeDOM2VBox,
  makeConverterToAbsoluteCoords,
  makeLocal2VBox,
  isPointInPoly,
  mapToMap,
} from "utils";


/**
 * CONFIG
 */
/*
const TIME_LIMIT_PER_LEVEL = 100;

const INITIAL_POINTS = 30;
const SHOCK_PENALTY = 25;
const MISSED_OPPORTUNITY_PENALTY = 0.3;
const POINTS_FOR_TAKEN_OPPORTUNITY = 0.9;
*/
import {
  levels,
} from "config";

import * as conf from "config";

/**
 * GLOBAL STATE :|
 */
let scoreEl = document.getElementById("score");
let score: number = 0;

let points: number; ///points, adding according to how long someone is pressing the right socket
let pointsTimerId;

// let stopGameLoop: () => void;
let stopGameLoop;

const timeLeftEl = document.getElementById("timeLeft");
const fpsEl = document.getElementById("fps");
const progressEl = document.getElementById("progress");
const pointsIncEl = document.getElementById("pointIncIcons");
const pointsDecEl = document.getElementById("pointDecIcons");
let resizeHasHappened: boolean = false; // true if the size of the svg has changed before the frame.
let timeLevel: number;
let currentMapData: MapData;
let unregisterDebugMarker: Array<() => void> = [];
let touchedSockets: Set<Socket> = new Set<Socket>();
let poweredSince: Map<Socket, number> = new Map<Socket, number>();
let levelTimerId: number | undefined;
let currentLevelNr: number = 0; // increase to start at higher level

let iconPrototypes: {
  shocked: SVGSVGElement,
  happy: SVGSVGElement,
  bored: SVGSVGElement,
}; // shocked, happy, bored
let iconElements: {
  shocked: Array<SVGSVGElement>,
  happy: Array<SVGSVGElement>,
  bored: Array<SVGSVGElement>,
} = {
  shocked: [],
  happy: [],
  bored: [],
};

const currentlyShockedPieces = new Set<GamePiece>();

/*
 * ensure that the icons are loaded
 */
const shockedSvgP = fetchSvg("icons/shocked.svg");
const happySvgP = fetchSvg("icons/happy_face.svg");
const boredSvgP = fetchSvg("icons/bored_face.svg");

/*
 * establish default values
 */
resetLevelData();

// To enable automatic sub-pixel offset correction when the window is resized:
// SVG.on(window, 'resize', function() { draw.spof() })

/*
 * START GAME
 */
gotoLevelN(currentLevelNr);



/*
 * establish default values to what they should
 * be at the start of a level.
 */
function resetLevelData() {
  timeLevel = conf.levels[currentLevelNr].timeLimit;
  points = conf.levels[currentLevelNr].initialPoints;
  updateProgressBar(points);
}

/*
 * unregister previous callbacks and unmount
 * the map if they're set
 */
function unregisterPrevious() {

  touchedSockets.clear();

  unregisterDebugMarkers();

  if (pointsTimerId !== undefined) {
    clearInterval(pointsTimerId);
  }
  if (levelTimerId !== undefined) {
    clearInterval(levelTimerId);
  }

  // make sure svg is removed from DOM
  if (currentMapData) {
    currentMapData.element.remove();
  }
}

// debugging: test level switch
// setTimeout(() => gotoLevelN(1), 5000);

function gotoNextLevel() {
  currentLevelNr++;
  return gotoLevelN(currentLevelNr);
}


function gotoLevelN(levelNr: number) {

  if (stopGameLoop) {
    stopGameLoop();
  }


  unregisterPrevious();
  console.log(`Loading level ${levelNr}`);
  loadMap(`maps/level${levelNr}.svg`, "levelMountPoint").then((data: MapData) => {

    prepareFeedbackIcons(data);

    // ensure that no further changes are made to the map data
    deepFreeze(data);

    // markElementPositions(data);
    resetLevelData();
    // setupLevelTimer(); TODO clarify design for timer/scoring
    currentMapData = data;
    // markPoweredSockets(data);
    for (let s of data.sockets) {
      registerInputHandlers(s, data);
    }

    // now, with everything configured, let's start up the updates
    stopGameLoop = runGameLoop(
      (deltaT, stopGameLoop) => update(deltaT, stopGameLoop, levelNr, data),
      conf.maxFps
    );

    console.log("STOP: ", stopGameLoop);

    console.log(`Successfully imported level ${levelNr}: `, data);
  });
}

function prepareFeedbackIcons(data: MapData) {
    /*
     * Make sure the SVGs are loaded
     */
    const iconsP = iconPrototypes ?
      Promise.resolve(iconPrototypes) :
      Promise.all([ shockedSvgP, happySvgP, boredSvgP, ])
      .then(([shocked, happy, bored]) => {
        iconPrototypes = { shocked, happy, bored };
        console.log("iconPrototypes", iconPrototypes);
        return iconPrototypes;
      });

    /*
     * make sure we have at least as many dom-elements
     * of each type as we have sockets in the map.
     */
    iconsP.then(iconPrototypes => {
      const prepareIcons = (containerDiv, type) => {
        while (iconElements[type].length < data.sockets.length) {
          const el = iconPrototypes[type].cloneNode(true);
          iconElements[type].push(el); // cache reference for later access
          if (containerDiv) {
            containerDiv.appendChild(el); // append to dom
            el.style.display = "none";
          }
        }
      };
      prepareIcons(pointsDecEl, "shocked");
      prepareIcons(pointsDecEl, "bored");
      prepareIcons(pointsIncEl, "happy");
    });

}

function setupLevelTimer() {
  levelTimerId = setInterval(() => {
    timeLevel--;
    if (timeLevel <= 0) {
      // timed out everything gets reset to the start of the level
      brrzzzl();
      resetLevelData();
    }
    if (timeLeftEl && scoreEl && score) {
      timeLeftEl.innerHTML = "Time left: " + Math.max(timeLevel, 0);
      scoreEl.innerHTML = "Score: " + score;
    }
  }, 1000 );
}

function registerInputHandlers(s: Socket, data: MapData) {

  console.log("registering input handlers");

  /* TODO find a solution to make this work with the svg-root
   * to catch cases where the window stays the same but the 
   * svg resizes. (Shouldn't happen atm due to width=100vw)
   */
  window.addEventListener("resize", e => {
    console.log("Resized svg, invalidating geometry-caches.");
    resizeHasHappened = true;
  });

  // setupDbgClickHandler(data);

  s.element.addEventListener("click", e => {
    const ptg = pathToGenerator(s, data, resizeHasHappened);
    console.log("[dbg] is clicked socket powered? ", ptg.size > 0);
    console.log("[dbg] poweredVia: ", ptg);
    for (let pathPiece of ptg) {
      pathPiece.element.style.stroke = conf.shockColor;
      delay(900).then(() => {
        pathPiece.element.style.stroke = conf.defaultColor;
      });
    }
  });

  s.element.addEventListener("mousedown", e => {
    e.preventDefault();
    touchedSockets.add(s);
  }, false);

  s.element.addEventListener("touchstart", e => {
    e.preventDefault();
    touchedSockets.add(s);
  }, false);

  s.element.addEventListener("mouseup", e => {
    touchedSockets.delete(s);
  }, false);

  s.element.addEventListener("touchend", e => {
    touchedSockets.delete(s);
  }, false);

}

/**
 * All the game-logic around scoring and GUI-updates
 */
function update(
  deltaT: number,
  stopGameLoop: (() => void),
  levelNr: number,
  data: MapData
) {

  const now = Date.now();

  const pathsToGenerator = mapToMap(
    data.sockets,
    s => {

      const visited = new Set<Rectangle | Switch>();
      const powered = new Set<Rectangle | Switch>();
      pathToGenerator(s, data, resizeHasHappened, visited, powered);
      return { visited, powered };
    }
  );

  /* sockets that have a path to a generator */
  const poweredSockets = new Set<Socket>(
    data.sockets.filter(s => {
      const ptg = pathsToGenerator.get(s);
      return ptg && ptg.powered.size > 0;
    })
  );

  /* connection lost for these sockets. remove 
   * them from the "connected" list. */
  poweredSince.forEach((timestamp, socket) => {
    if(!poweredSockets.has(socket)) {
      poweredSince.delete(socket);
    }   
  });

  /* Newly connected sockets. Add them to the list. */
  poweredSockets.forEach(socket => {
    if(!poweredSince.has(socket)) {
      poweredSince.set(socket, now);
    } 
  });

  const enabled = new Set<Socket>(
    data.sockets.filter(s =>
      // sockets that are currently being shocked, are exempt from scoring
      !currentlyShockedPieces.has(s)
    )
  );

  const enabledTouched = filterSet(
    enabled,
    s => touchedSockets.has(s)
  );

  const enabledUntouched = filterSet(
    enabled,
    s => !touchedSockets.has(s)
  );

  const safeButUntouched = filterSet(
    enabledUntouched,
    s => !poweredSockets.has(s)
  );

  const safeAndTouched = filterSet(
    enabledTouched,
    s => !poweredSockets.has(s)
  );

  const poweredAndTouched = filterSet(
    enabledTouched,
    s => 
      poweredSockets.has(s) && 
      now >= (poweredSince.get(s) + conf.delayToBePowered)
      /* ^^^
       * only get shocket through sockets that have 
       * been connected to a generator for at least 
       * <delayToBePowered> milliseconds. This is
       * intended to make the game a bit more forgiving 
       * and less frustrating.
       */
  );

  for (let s of safeButUntouched) {
    points -= conf.levels[levelNr].missedOpportunityPenalty * deltaT / 1000;
  }

  for (let s of safeAndTouched) {
    points += conf.levels[levelNr].takenOpportunityPoints * deltaT / 1000;
  }

  for (let s of poweredAndTouched) {
    // vibration not yet started for that socket

    const ptg = pathsToGenerator.get(s);
    if(ptg) {
      for (let pathPiece of ptg.visited) {
        currentlyShockedPieces.add(pathPiece);
        delay(conf.shockDuration * 1000).then(() => {
            currentlyShockedPieces.delete(pathPiece);
        });
      }
    }

    points -= conf.levels[levelNr].shockPenalty;
    brrzzzl(conf.shockDuration * 1000);
    //}
  }

  points = Math.max(points, 0);
  points = Math.min(points, 100);

  if (points >= 100) {
    // score += timeLevel; TODO clarify design for timer/scoring
    gotoNextLevel();
  }

  updateFpsCounter(deltaT);
  updateProgressBar(points);
  updateStrokeColors({
    safeAndTouched,
    pathsToGenerator,
    currentlyShockedPieces,
    mapData: data
  });
  updateFeedbackIcons({
    happy: safeAndTouched.size,
    bored: safeButUntouched.size,
    shocked: poweredAndTouched.size,
  });

  resizeHasHappened = false; // all geometry-caches should have been updated by now.
}

function updateStrokeColors(args) {
  const {
    mapData,
    safeAndTouched,
    pathsToGenerator,
    currentlyShockedPieces,
  } = args;

  const toStrokeWith = new Map<GamePiece, string>(); // maps to color-string

  for (let s of mapData.sockets) {
    toStrokeWith.set(s, conf.defaultColor);
  }
  for (let g of mapData.generators) {
    toStrokeWith.set(g, conf.defaultColor);
  }
  for (let p of mapData.powerlines) {
    toStrokeWith.set(p, conf.defaultColor);
  }
  for (let s of mapData.switches) {
    toStrokeWith.set(s, conf.defaultColor);
  }

  for (let s of safeAndTouched) {
    const ptg = pathsToGenerator.get(s);
    if(ptg) {
      for (let pathPiece of ptg.visited) {
        toStrokeWith.set(pathPiece, conf.happyColor);
      }
    }
  }

  for (let piece of currentlyShockedPieces) {
    toStrokeWith.set(piece, conf.shockColor);
  }

  for (let [pathPiece, color] of toStrokeWith) {
    pathPiece.element.style.stroke = color;
  }
}


function updateFpsCounter (deltaT: number) {
  if (deltaT > 0) {
    const fps = 1000 / deltaT;
    if (fpsEl) {
      // the slice is to ensure a fixed string length. need to change this to use non-collapsible spaces.
      fpsEl.innerHTML = "scoring-fps: " + ("____" + fps.toFixed(1)).slice(-4);
    }
  }
}

function updateFeedbackIcons(counts) {
  function updateIconType(type) {
    if (iconElements && iconElements[type]) {
      // make counts[type] icons of <type> visible
      for (let i = 0; i < iconElements[type].length; i++) {
        iconElements[type][i].style.display =
          (i < counts[type]) ?
          "block" : /* visible */
          "none"; /* invisible */
      }
    }
  }
  updateIconType("shocked");
  if (conf.levels[currentLevelNr].missedOpportunityPenalty > 0.01)
    updateIconType("bored");
  updateIconType("happy");
}


function updateProgressBar(points: number): void {
  const pointsRounded = points.toFixed(1);

  if (progressEl) {
    progressEl.innerHTML = pointsRounded + "%";
    progressEl.style.width = pointsRounded + "%";
    if (points > 20 && points < 50) {
      progressEl.classList.remove("progress-bar-danger");
      progressEl.classList.add("progress-bar-warning");
    } else if (points > 50) {
      progressEl.classList.remove("progress-bar-warning");
      progressEl.classList.add("progress-bar-success");
    } else {
      //
    }
  }
}

/**
* https://www.sitepoint.com/use-html5-vibration-api/
* https://davidwalsh.name/vibration-api
*/
export function brrzzzl(durationInMs: number = 900) {
  // TODO visual effect for same duration
  if ("vibrate" in navigator) {
    // vibration API supported
    navigator.vibrate([
        durationInMs * 5 / 9,
        durationInMs * 3 / 9,
        durationInMs * 1 / 9,
    ]);
    console.log("I am vibrating!!");
  }
}

/**
 * Function for debugging the coordinate
 * system tranformation. Marks the origin of
 * all svg-elements and all path-ends in the
 * map with a circle.
 */

function markElementPositions(mapData: MapData) {
  for (let s of mapData.sockets) {
    markCoords(mapData.element, s.pos.x, s.pos.y);
  }

  for (let g of mapData.generators) {
    markCoords(mapData.element, g.pos.x, g.pos.y);
  }

  for (let p of mapData.powerlines) {
    markCoords(mapData.element, p.start.x, p.start.y);
    markCoords(mapData.element, p.end.x, p.end.y);
  }
}

/**
 * Function to visualise the sockets
 * that are powered (for debug-purposes)
 */
function markPoweredSockets(mapData: MapData) {
  for (let s of mapData.sockets) {
    // mark powered sockets
    const unregister = markCoordsLive(
      mapData.element, s.pos.x, s.pos.y,
      () => isPowered(s, mapData, resizeHasHappened)
    );
    unregisterDebugMarker.push(unregister);
  }
}

function unregisterDebugMarkers() {
  let unregister;
  while (unregister = unregisterDebugMarker.pop()) {
    if (unregister && hasJSType("Function", unregister)) {
      console.log("Unregistering debug mark");
      unregister();
    }
  }
}

function setupDbgClickHandler(data: MapData) {
  data.element.addEventListener("click", e => {
    const dom2vbox = makeDOM2VBox(data.element);
    const intersectedElements = svgElementsAt(
      dom2vbox({x : e.clientX, y: e.clientY}),
      data.element,
    );
    const pieces = piecesAt(
      data,
      dom2vbox({x : e.clientX, y: e.clientY}),
    );
    console.log("clicked on the following: ", intersectedElements, pieces);
  });
}
