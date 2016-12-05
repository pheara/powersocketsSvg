// custom declarations / headers like for `svg-path-parser`
/// <reference path="declarations.d.ts"/>

// declarations/headers installed via `./node_modules/.bin/typings install <pkg>`
/// <reference path="../typings/index.d.ts"/>

// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

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

import "wout/svg.js";
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
} from "utils";

/**
 * CONFIG
 */

const TIME_LIMIT_PER_LEVEL = 100;

const INITIAL_POINTS = 30;
const SHOCK_PENALTY = 10;
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
}

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

  if(pointsTimerId !== undefined) {
    clearInterval(pointsTimerId);
  }
  if(levelTimerId !== undefined) {
    clearInterval(levelTimerId);
  }

  // make sure svg is removed from DOM
  if(currentMapData) {
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
    //markPoweredSockets(data);
    for (const s of data.sockets) {
      registerInputHandlers(s, data);
    }

    startScoring(data);

    console.log(`Successfully imported level ${levelNr}: `, data);
  })
}

function prepareFeedbackIcons(data: MapData) {
    /*
     * Make sure the SVGs are loaded
     */
    const iconsP = iconPrototypes?
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
        while(iconElements[type].length < data.sockets.length) {
          const el = iconPrototypes[type].cloneNode(true);
          iconElements[type].push(el); // cache reference for later access
          if(containerDiv) {
            containerDiv.appendChild(el); // append to dom
            el.style.display = "none";
          }
        }
      }
      prepareIcons(pointsDecEl, "shocked");
      prepareIcons(pointsDecEl, "bored");
      prepareIcons(pointsIncEl, "happy");
    });

}

function setupLevelTimer() {
  levelTimerId = setInterval(() => {
    timeLevel--;
    if(timeLevel <= 0) {
      // timed out everything gets reset to the start of the level
      brrzzzl();
      resetLevelData();
    }
    if(timeLeftEl) {
      timeLeftEl.innerHTML = "Time left: " + Math.max(timeLevel, 0);
    }
  }, 1000 );
}

function registerInputHandlers(s: Socket, data: MapData) {

  console.log("registering input handlers");

  s.element.addEventListener('click', e => {
    console.log("[dbg] is clicked socket powered? ", isPowered(s, data));
  });

  s.element.addEventListener('touchstart', e => {
    e.preventDefault();
    touchedSockets.add(s);
  }, false);

  s.element.addEventListener('touchend', e => {
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
function updatePoints(touchedSockets, data){

  if(touchesEl) { // TODO deletme; for debugging
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
  // console.log("touchedSockets: ", safeAndTouched);

  for (const s of safeButUntouched) {
    points -= MISSED_OPPORTUNITY_PENALTY;
  }

  for	(const ts	of touchedSockets)	{

    if( safeAndTouched.has(ts) ) {
      points += POINTS_FOR_TAKEN_OPPORTUNITY;

    } else /* touched and powered */ {
      points -= SHOCK_PENALTY;

      /*
      reset touchedSockets and increase shock penalty to one big chunk?
      bad idea - the list of touchedSockets should be correct at all times
      TODO better: lock socket while previous shock is still vibrating
      */
      brrzzzl();
    }
  }

  points = Math.max(points, 0);
  points = Math.min(points, 100);

  if(points >= 100) {
    gotoNextLevel();
  }

  updateFeedbackIcons(safeAndTouched, safeButUntouched)
  updateProgressBar(points);
}

function updateFeedbackIcons(safeAndTouched, safeButUntouched) {
  if(iconElements && iconElements.bored) {
    for(let i = 0; i < iconElements.bored.length; i++) {
       iconElements.bored[i].style.display =
         (i < safeButUntouched.size) ?
         "block" :
         "none";
    }
  }
  if(iconElements && iconElements.happy) {
    for(let i = 0; i < iconElements.happy.length; i++) {
      iconElements.happy[i].style.display =
        (i < safeAndTouched.size) ?
        "block" :
        "none";
    }
  }
}


function updateProgressBar(points: number): void {
  const pointsRounded = points.toFixed(1);

  if(progressEl) {
    progressEl.innerHTML = pointsRounded + "%";
    progressEl.style.width = pointsRounded + "%";
    if (points > 20 && points < 50) {
      progressEl.classList.remove('progress-bar-danger');
      progressEl.classList.add('progress-bar-warning');
    } else if (points > 50) {
      progressEl.classList.remove('progress-bar-warning');
      progressEl.classList.add('progress-bar-success');
    } else {
      //
    }
  }
}

/**
* https://www.sitepoint.com/use-html5-vibration-api/
* https://davidwalsh.name/vibration-api
*/
export function brrzzzl(){
  //TODO visual effect for same duration
  if ("vibrate" in navigator) {
	// vibration API supported
    navigator.vibrate([500, 300, 100]);
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
  for(const s of mapData.sockets) {
    markCoords(mapData.element, s.pos.x, s.pos.y);
  }

  for(const g of mapData.generators) {
    markCoords(mapData.element, g.pos.x, g.pos.y);
  }

  for(const p of mapData.powerlines) {
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
  while(unregister = unregisterDebugMarker.pop()){
    if(unregister && hasJSType("Function", unregister)) {
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
