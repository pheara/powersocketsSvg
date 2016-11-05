// custom declarations / headers like for `svg-path-parser`
/// <reference path="declarations.d.ts"/>

// declarations/headers installed via `./node_modules/.bin/typings install <pkg>`
/// <reference path="../typings/index.d.ts"/>

// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

import { fetchMap } from "fetch-map";
// declare var parseSvgPath: any; // no .d.ts supplied

import "wout/svg.js";
//import SVG from "jspm_packages/svg.js@2.3.6/svg.js.d.ts";

import { hasJSType } from "utils";

const blueprintSVG = document.getElementById("blueprint");


//To enable automatic sub-pixel offset correction when the window is resized:
//SVG.on(window, 'resize', function() { draw.spof() })

fetch("demo.svg")
.then(resp => resp.text())
//.then(resp => resp.blob())
.then(svgAsText => {
  // console.log(svgAsText);
  const draw = SVG("svgJsMount");
  console.log("Draw: ", draw);
  const svg = draw.svg(svgAsText);
  console.log("Svg: ", svg);
  // TODO the mounted svg is 0x0 of size but contains all the necessary DOM
});

fetchMap("demo.svg").then(data => {
  console.log(data);
  const backgroundDiv = document.getElementById("background");
  if(backgroundDiv) {
    backgroundDiv.appendChild(data.element);
  }
  //const map = SVG(data.element);
  //console.log('map: ', map);


  /*
   * demo that checks which svg elements
   * are at a given point
   */
  data.element.addEventListener("click", e => {
    var elements = elementsAt(data.element, e.clientX, e.clientY);
    console.log("intersectionList: ", elements);
    //TODO try to get checkIntersection working
  })

  /*
   * naive collision (only works with sockets that
   * are directly connected to a generator)
   */
  for(const s of data.sockets) {

    if(isPowered(s, data)) {
      markCoords(data.element, s.pos.x, s.pos.y);
    }
    s.element.addEventListener("click", e => {
      if(isPowered(s, data)) {
        console.log("clicked powered socket *brzzl*");
      } else {
        console.log("that socket is safe *phew*");
      }
    })
  }
});


// ------------- //

/**
  * adapted from source of 
  * <http://xn--dahlstrm-t4a.net/svg/interactivity/intersection/sandbox_hover.svg>
  */
function elementsAt(svg: SVGSVGElement, x: number, y: number) {
    var svgRect = svg.createSVGRect();
    svgRect.x = x;
    svgRect.y = y;
    svgRect.width = svgRect.height = 1;
    //let list = svg.getIntersectionList(svgRect, null);
    return svg.getIntersectionList(svgRect, svg);
}


function isPowered(s : Socket, data): boolean {
  const attachedLines = data.powerlines.filter(p =>
      attached(s, p)
    )

  for(const p of attachedLines) {
    for(const g of data.generators) {
      if(attached(g, p)) {
        return true;
      }
    }
  }

  return false;
}

function attached(rect: Rectangle, powerline: Powerline): boolean {
    return insideRect(rect, powerline.start) || insideRect(rect, powerline.end);
}

function insideRect(rect: Rectangle, point: Point): boolean {
    return rect.pos.x <= point.x &&
           point.x <= rect.pos.x + rect.width &&
           rect.pos.y <= point.y &&
           point.y <= rect.pos.y + rect.height;
}


/**
 * Draws a dark-red circle at the specified coordinates.
 */
function markCoords(svg: SVGSVGElement, x: number, y: number) {
  var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle'); //Create a path in SVG's namespace
  circle.setAttribute("cx", x.toString());
  circle.setAttribute("cy", y.toString());
  circle.setAttribute("r", "8");
  circle.style.fill = "#900";
  svg.appendChild(circle);
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
