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
  level,
} from "config";

/**
 * GLOBAL STATE :|
 */
let scoreHTML = document.getElementById("score");
let score: number = 0;

const blueprintSVG = document.getElementById("blueprint");
let points: number; ///points, adding according to how long someone is pressing the right socket
let pointsTimerId;

const timeLeftEl = document.getElementById("timeLeft");
const touchesEl = document.getElementById("touches");
const progressEl = document.getElementById("progress");
const pointsIncEl = document.getElementById("pointIncIcons");
const pointsDecEl = document.getElementById("pointDecIcons");
let timeLevel: number;
let currentMapData: MapData;
let unregisterDebugMarker: Array<() => void> = [];
let touchedSockets: Set<Socket> = new Set<Socket>();
let levelTimerId: number | undefined;
let currentLevelNr: number = 0;

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

const currentlyShockedSockets = new Set<Socket>();

/*
 * ensure that the icons are loaded
 */
const shockedSvgP = fetchSvg("shocked.svg");
const happySvgP = fetchSvg("happy_face.svg");
const boredSvgP = fetchSvg("bored_face.svg");

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
  timeLevel = level[currentLevelNr][0]; //TIME_LIMIT_PER_LEVEL;
  points = level[currentLevelNr][1]; //INITIAL_POINTS;
  updateProgressBar(points);
}

/*
 * unregister previous callbacks and unmount
 * the map if they're set
 */
function unregisterPrevious() {

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
  unregisterPrevious();
  console.log(`Loading level ${levelNr}`);
  loadMap(`level${levelNr}.svg`, "levelMountPoint").then((data: MapData) => {

    prepareFeedbackIcons(data);

    // ensure that no further changes are made to the map data
    deepFreeze(data);

    // markElementPositions(data);
    resetLevelData();
    setupLevelTimer();
    currentMapData = data;
    // markPoweredSockets(data);
    for (const s of data.sockets) {
      registerInputHandlers(s, data);
    }

    startScoring(data);

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
    if (timeLeftEl && scoreHTML && score) {
      timeLeftEl.innerHTML = "Time left: " + Math.max(timeLevel, 0);
      scoreHTML.innerHTML = "Score: " + score;
    }
  }, 1000 );
}

function registerInputHandlers(s: Socket, data: MapData) {

  console.log("registering input handlers");

  // setupDbgClickHandler(data);

  s.element.addEventListener("click", e => {
    const ptg = pathToGenerator(s, data);
    console.log("[dbg] is clicked socket powered? ", ptg.size > 0);
    console.log("[dbg] poweredVia: ", ptg);
    for (const pathPiece of ptg) {
      pathPiece.element.style.stroke = "red";
      delay(900).then(() => {
        pathPiece.element.style.stroke = "black";
      });
    }
  });

  s.element.addEventListener("touchstart", e => {
    e.preventDefault();
    touchedSockets.add(s);
  }, false);

  s.element.addEventListener("touchend", e => {
    touchedSockets.delete(s);
  }, false);

}

function startScoring(mapData: MapData) {
  pointsTimerId = setInterval(
    () => updatePoints(touchedSockets, mapData),
    100
  ); /// () => has to be there
}

// ------------- //
function updatePoints(touchedSockets, data) {

  /*
  if (touchesEl) { // TODO deletme; for debugging
    touchesEl.innerHTML = " touches " + touchedSockets.size;
  }
  */
  const pathsToGenerator = mapToMap(
    data.sockets,
    s => pathToGenerator(s, data)
  );

  const poweredSockets = new Set<Socket>(
    data.sockets.filter(s => {
      const ptg = pathsToGenerator.get(s);
      return ptg && ptg.size > 0;
    })
  );

  const safeButUntouched = new Set<Socket>(
    data.sockets.filter(s =>
      !touchedSockets.has(s) && !poweredSockets.has(s)
    )
  );

  const safeAndTouched = filterSet(
    touchedSockets,
    s => !poweredSockets.has(s)
  );

  const poweredAndTouched = filterSet(
    touchedSockets,
    s => !safeAndTouched.has(s)
  );
  // console.log("touchedSockets: ", safeAndTouched);

  for (const s of safeButUntouched) {
    points -= level[currentLevelNr][3]; //MISSED_OPPORTUNITY_PENALTY;
  }

  for (const s of safeAndTouched) {
      points += level[currentLevelNr][4]; //POINTS_FOR_TAKEN_OPPORTUNITY;
  }

  for (const s of poweredAndTouched) {
      if (!currentlyShockedSockets.has(s)) {

          // s.element.style.stroke = "red";
          // vibration not yet started for that socket
          currentlyShockedSockets.add(s);
          delay(1000).then(() => {
              currentlyShockedSockets.delete(s);
              // s.element.style.stroke = "black";
          });

          points -= level[currentLevelNr][2]; //SHOCK_PENALTY;
          brrzzzl(900);
          const ptg = pathsToGenerator.get(s);
          if (ptg) { // always true, but necessary for type-check
            for (const pathPiece of ptg) {
              pathPiece.element.style.stroke = "red";
              delay(900).then(() => {
                pathPiece.element.style.stroke = "black";
              });
            }
          }

      }
  }

  points = Math.max(points, 0);
  points = Math.min(points, 100);

  if (points >= 100) {
    score += timeLevel;
    gotoNextLevel();
  }

  updateFeedbackIcons({
    happy: safeAndTouched.size,
    bored: safeButUntouched.size,
    shocked: poweredAndTouched.size,
  });
  updateProgressBar(points);
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
  for (const s of mapData.sockets) {
    markCoords(mapData.element, s.pos.x, s.pos.y);
  }

  for (const g of mapData.generators) {
    markCoords(mapData.element, g.pos.x, g.pos.y);
  }

  for (const p of mapData.powerlines) {
    markCoords(mapData.element, p.start.x, p.start.y);
    markCoords(mapData.element, p.end.x, p.end.y);
  }
}

/**
 * Function to visualise the sockets
 * that are powered (for debug-purposes)
 */
function markPoweredSockets(mapData: MapData) {
  for (const s of mapData.sockets) {
    // mark powered sockets
    const unregister = markCoordsLive(
      mapData.element, s.pos.x, s.pos.y,
      () => isPowered(s, mapData)
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
    const elements = svgElementsAt(
      dom2vbox({x : e.clientX, y: e.clientY}),
      data.element,
    );
    const pieces = piecesAt(
      data,
      dom2vbox({x : e.clientX, y: e.clientY}),
    );
    console.log("clicked on the following: ", elements, pieces);
  });
}
