import { foo } from "test-import";
// import SVG from "wout/svg.js";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

console.log("hello typescript", foo);

fetch("demo.svg")
.then(response => {
});

const blueprintSVG = document.getElementById("blueprint");

fetch("demo.svg")
// .then(resp => resp.text())
.then(resp => resp.blob())
.then(blob => console.log(blob));


const backgroundDiv = document.getElementById("background");

new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "demo.svg");
  // Following line is just to be on the safe side;
  // not needed if your server delivers SVG with correct MIME type
  xhr.overrideMimeType("image/svg+xml");
  xhr.send("");
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // console.log(xhr.responseText);
        console.log("SVG request successful", xhr);
        resolve(xhr);
      } else {
        console.error(xhr.statusText);
        reject(xhr);
      }
    }
  };
})
.then(xhr => {
  backgroundDiv.appendChild(xhr.responseXML.documentElement);
})
.then(() => {
  // start parsing the svg-path data

});


/*
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
