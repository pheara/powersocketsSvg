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
} from "utils";


/**
 * GLOBAL STATE :|
 */
const blueprintSVG = document.getElementById("blueprint");
let points: number = 0; ///points, adding according to how long someone is pressing the right socket
let pointsTimerId;

const timeLeftEl = document.getElementById("timeLeft");
const touchesEl = document.getElementById("touches");
const progressEl = document.getElementById("progress");
const pointsEl = document.getElementById("points");
let timeLevel: number = 100;
let currentMapData: MapData;
let unregisterDebugMarker: Array<() => void> = [];
let touchedSockets: Array<Socket> = [];
let levelTimerId: number | undefined;


// To enable automatic sub-pixel offset correction when the window is resized:
// SVG.on(window, 'resize', function() { draw.spof() })

/*
 * START GAME
 */
gotoLevelN(0);

// debugging: test level switch
// setTimeout(() => gotoLevelN(1), 5000);

function gotoLevelN(levelNr: number) {
  cleanMap();
  console.log(`Loading level ${levelNr}`);
  loadMap(`level${levelNr}.svg`, "background").then((data: MapData) => {
    setupLevelTimer();
    currentMapData = data;
    markPoweredSockets(data);
    for (const s of data.sockets) {
      registerInputHandlers(s, data);
    }
  })
}

function cleanMap() {
  unregisterDebugMarkers();

  if(levelTimerId) {
    clearInterval(levelTimerId);
  }

  // make sure svg is removed from DOM
  if(currentMapData) {
    currentMapData.element.remove();
  }
}

function setupLevelTimer() {
  levelTimerId = setInterval(() => {
    timeLevel--;
    if(timeLevel <= 0) {
      // TODO timeout
    }
    if(timeLeftEl) {
      timeLeftEl.innerHTML = "Time left: " + Math.max(timeLevel, 0);
    }
  }, 1000 );
}

function registerInputHandlers(s: Socket, data: MapData) {
  s.element.addEventListener('touchstart', e => {

    e.preventDefault();

    touchedSockets.push(s);

    if (touchedSockets.length > 1){
      if(touchesEl) touchesEl.innerHTML +=
        " touches " + touchedSockets.length;
    } else {
      clearInterval(pointsTimerId);
      pointsTimerId = setInterval(() => addpoints(touchedSockets, data), 100 ); /// () => has to be there
      if(touchesEl) touchesEl.innerHTML += touchedSockets.length;
    }


  }, false);

  s.element.addEventListener('touchend', e => {

    touchedSockets.splice(touchedSockets.indexOf(s));

    if(touchesEl) touchesEl.innerHTML = " touch end " + touchedSockets.length;

    if (touchedSockets.length == 0){
      clearInterval(pointsTimerId);
    }

  }, false);

}

// ------------- //
function addpoints(touchedSockets, data){

  for	(let ts	of	touchedSockets)	{

    if (isPowered(ts, data)) {

      brrzzzl();
      console.log("clicked powered socket *brzzl*");

      clearInterval(pointsTimerId);
      //touchedSockets.splice(touchedSockets.indexOf(ts));

    } else {
      console.log("that socket is safe *phew*");

      points += touchedSockets.length * 2;

      updateProgressBar(points);

      if(pointsEl) pointsEl.innerHTML = "Points " + points;
    }
  }
}


function updateProgressBar(points: number): void {
  if(progressEl) {
    progressEl.innerHTML = points + "%";
    progressEl.style.width = points + "%";
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
