// custom declarations / headers like for `svg-path-parser`
/// <reference path="declarations.d.ts"/>

// declarations/headers installed via `./node_modules/.bin/typings install <pkg>`
///// <reference path="../typings/index.d.ts"/>

// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

import {
  intersect,
  shape,
} from "svg-intersections";
/*
import "svg-intersections";
declare var intersect;
declare var shape;
*/

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
} from "is-powered";

import {
  loadMap,
  fetchSvg,
} from "fetch-map";
// declare var parseSvgPath: any; // no .d.ts supplied

// import Immutable from "immutable";

// import "wout/svg.js";
// import SVG from "jspm_packages/svg.js@2.3.6/svg.js.d.ts";

import {
  hasJSType,
  contains,
  markCoords,
  markCoordsLive,
  getIn,
  svgElementsAt,
  delay,
  deepFreeze,
  filterSet,
  makeDOM2VBox,
  makeConverterToAbsoluteCoords,
} from "utils";


/**
 * CONFIG
 */

const TIME_LIMIT_PER_LEVEL = 100;

const INITIAL_POINTS = 30;
const SHOCK_PENALTY = 25;
const MISSED_OPPORTUNITY_PENALTY = 0.3;
const POINTS_FOR_TAKEN_OPPORTUNITY = 0.9;



/**
 * GLOBAL STATE :|
 */
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
  timeLevel = TIME_LIMIT_PER_LEVEL;
  points = INITIAL_POINTS;
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

    deletemeCollisionDbg(data); //TODO deletme

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
    if (timeLeftEl) {
      timeLeftEl.innerHTML = "Time left: " + Math.max(timeLevel, 0);
    }
  }, 1000 );
}

function registerInputHandlers(s: Socket, data: MapData) {

  console.log("registering input handlers");

  /*
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
  */

  s.element.addEventListener("click", e => {
    console.log("[dbg] is clicked socket powered? ", isPowered(s, data));
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

  if (touchesEl) { // TODO deletme; for debugging
    touchesEl.innerHTML = " touches " + touchedSockets.size;
  }

  const safeButUntouched = new Set<Socket>(
    data.sockets.filter(s =>
      !touchedSockets.has(s) && !isPowered(s, data)
    )
  );

  const safeAndTouched = filterSet(
    touchedSockets,
    s => !isPowered(s, data)
  );

  const poweredAndTouched = filterSet(
    touchedSockets,
    s => !safeAndTouched.has(s)
  );
  // console.log("touchedSockets: ", safeAndTouched);

  for (const s of safeButUntouched) {
    points -= MISSED_OPPORTUNITY_PENALTY;
  }

  for (const s of safeAndTouched) {
      points += POINTS_FOR_TAKEN_OPPORTUNITY;
  }

  for (const s of poweredAndTouched) {
      if (!currentlyShockedSockets.has(s)) {
          // vibration not yet started for that socket
          currentlyShockedSockets.add(s);
          points -= SHOCK_PENALTY;
          brrzzzl(900);
          delay(950).then(() => {
              currentlyShockedSockets.delete(s);
          });
      }
  }

  points = Math.max(points, 0);
  points = Math.min(points, 100);

  if (points >= 100) {
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


// ------------- //


/*
//TODO how to do collision? also: run box-collision first

[svg.js has intersections](https://github.com/amatiash/svg.intersections.js)

// <http://www.kevlindev.com/geometry/2D/intersections/index.htm>
// http://stackoverflow.com/questions/5396657/event-when-two-svg-elements-touch
// raphael js has collision detection ([source](http://stackoverflow.com/questions/12550635/how-can-i-improve-on-this-javascript-collision-detection))
//
// http://stackoverflow.com/questions/2174640/hit-testing-svg-shapes
// var nodelist = svgroot.getIntersectionList(hitrect, null);
// [working example](http://xn--dahlstrm-t4a.net/svg/interactivity/intersection/sandbox_hover.svg)
//
// [paper.js renders to canvas and has collision too](http://paperjs.org/reference/path/#getintersections-path)

//TODO: t-pieces. connector box?
window.SVG4dbg = SVG;
var svgParent = document.getElementById('background');
var draw = SVG(svgParent);
window.draw4dbg = draw;
var rect = draw.rect(100, 100).attr({ fill: '#f06' });

var draw2 = SVG(blueprintSVG);
window.draw2fordbg = draw2;
*/


/*
declare var Raphael: any; //imported in index.html


//TODO take a look at the lightweight svg.js



importing svg data

* https://github.com/wout/svg.js#import--export-svg
* https://github.com/wout/raphael-svg-import (deprecated for svg.js)


parsing path data

* https://github.com/hughsk/svg-path-parser
* https://www.npmjs.com/package/parse-svg
* https://github.com/canvg/canvg





console.log(Raphael);

// Creates canvas 320 × 200 at 10, 50
// var paper = Raphael(10, 50, 320, 200);
//
// // Creates circle at x = 50, y = 40, with radius 10
// var circle = paper.circle(50, 40, 10);
// // Sets the fill attribute of the circle to red (#f00)
// circle.attr("fill", "#f00");
//
// // Sets the stroke attribute of the circle to white
// circle.attr("stroke", "#fff");
//
 */

function deletemeCollisionDbg(data) {
    //TODO <deletme>
    const getAttributes = el => {
      const acc = {}
      for(let a of el.attributes) {
        const parsed = Number.parseFloat(a.value);
        if(!isNaN(parsed) && parsed.toString() === a.value) {
          // correct parse => numerical attribute
          acc[a.name] = parsed;
        } else {
          // string attribute
          acc[a.name] = a.value;
        }
      }
      return acc;
    }
    //TODO toAbs (all coordinates need to be in same space)
    // makeConverterToAbsoluteCoords(svgRoot, elem)(p)
    // but how for paths' "d"-attribute?


    // run intersection myself? with some kind of iterative enhancement with getPointAt

    /*
    const rect2shape = r => {
      const getNumAttr = attrName =>
        Number.parseFloat(r.getAttribute(attrName))
      return shape("rect", {
        x: y: height: width: });
    }
    */
    const path2shape = p => {
      return {
        type: "path",
        d: p.getAttribute("d")
      };
    }

    const g = data.generators[0].element;
    const s = data.switches[0].element;
    const ps = data.powerlines.map(p => p.element);

    const switchShape = path2shape(s);
    const switchPoints = toPoints(switchShape);
    const toAbs = makeConverterToAbsoluteCoords(
      data.element, s
    );

    // we only need the transform that's applied to the powerlines-group
    /*
  <g
     transform="translate(-85.731594,24.276162)" <-- apply this translate to the coordinates and all is fine
     id="switches">
    <path
       id="path4148-3"
       d="M 280.52317,18.27923 L 280.52317,29.12718 C 243.01458,29.12718 280.52317,29.12718 243.01458,29.12718 L 243.01458,18.27923 Z"

    */
    //TODO produces viewspace coords for some reason
    const absSwitchPoints = switchPoints.map(
      p => toAbs({x: p.x, y: p.y})
    );
    switchPoints.forEach(sp => {
      const mc = markCoords;
      markCoords(data.element, sp.x, sp.y);
    })
    absSwitchPoints.forEach(asp => {
      const mc = markCoords;
      markCoords(data.element, asp.x, asp.y);
    })
    console.log("switchPoints: ", switchPoints, absSwitchPoints );


/*
    ps.forEach(p => {
      // console.log("testing intersections: ", intersect(p, g));
      const sp = shape(p.tagName, getAttributes(p));
      const ss = shape(s.tagName, getAttributes(s));
      console.log(
        "testing intersections: ",
        intersect(sp, ss)
      );
    });
    */

    //TODO </deletme>
}
