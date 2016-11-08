/// <reference path="declarations.d.ts"/>
import parseSvgPath from "svg-path-parser";
// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

import {
  valueOr,
  hasJSType,
  delay,
 } from "utils";


export function loadMap(url: string, mountpoint: string) {
  const mapDataPromise = fetchSvg(url).then(svg => {
    const backgroundDiv = document.getElementById(mountpoint);
    if (backgroundDiv) {
      backgroundDiv.appendChild(svg);
      return extractMapData(svg);
    } else {
      throw new Error(
        `Couldn't mount map "${url}" at mountpoint with id "${mountpoint}".`
      );
    }
  });
  return mapDataPromise;
}

function fetchSvg(url: string): Promise<SVGSVGElement> {
  const svgXhrPromise = new Promise<XMLHttpRequest>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    // Following line is just to be on the safe side;
    // not needed if your server delivers SVG with correct MIME type
    xhr.overrideMimeType("image/svg+xml");
    xhr.send("");
    xhr.onload = (e) => {
      if (xhr.status === 200) {
        // console.log(xhr.responseText);
        console.log("SVG request successful", xhr);
        resolve(xhr);
      } else {
        console.error(xhr.statusText, xhr);
        reject(xhr);
      }
    };
  });

  const svgPromise: Promise<SVGSVGElement> = svgXhrPromise
    .then(xhr => xhr.responseXML.documentElement);

  return svgPromise;
}

function extractMapData(svg: SVGSVGElement) {
  const powerlines = getPowerlines(svg);
  const switches = getSwitches(svg);
  const sockets = getRectanglesInLayer(svg, "sockets");
  const generators = getRectanglesInLayer(svg, "generators");

  return {
    powerlines,
    generators,
    sockets,
    switches,
    element: svg,
  };
}

function getSwitches(svg: SVGSVGElement): Switch[] {
  const layer = svg.querySelector("#switches");
  const elements = layer.getElementsByTagName("path");
  const switches: Switch[] = [];
  for (const el of elements) {
    //
    const getAttr = (attr: string) => {
      const attrAsStr = valueOr(el.getAttribute(attr), "");
      return valueOr(Number.parseInt(attrAsStr), 0); // parse to number
    };
    const cx = getAttr("inkscape:transform-center-x");
    const cy = getAttr("inkscape:transform-center-y");
    console.log("switch center: ", cx, cy);
    console.log("switch element: ", { el });
    delay(1).then(() => addClientRect(el, svg));
    switches.push({
      element: el,
    });
  }
  return switches;
}

function addClientRect(el: SVGElement, svg: SVGSVGElement) {
  const crData = el.getBoundingClientRect()
  const clientRect = document.createElementNS("http://www.w3.org/2000/svg", "rect"); // Create a path in SVG's namespace
  clientRect.setAttribute("x", crData.left.toString());
  clientRect.setAttribute("y", crData.top.toString());
  clientRect.setAttribute("height", crData.height.toString());
  clientRect.setAttribute("width", crData.width.toString());
  clientRect.style.fill = "#0000";
  clientRect.style.stroke = "#900";
  svg.appendChild(clientRect);
  console.log("Added clientRectangle ", clientRect, crData);
}

function getPowerlines(svg: SVGSVGElement): Powerline[] {
    const powerlinesLayer = svg.querySelector("#powerlines");
    const powerlineElements = powerlinesLayer.getElementsByTagName("path");
    const powerlines: Powerline[] = [];
    for (const el of powerlineElements) {

      const toAbs = makeConverterToAbsoluteCoords(svg, el);
      const start = toAbs(el.getPointAtLength(0));
      const end = toAbs(el.getPointAtLength(el.getTotalLength()));

      powerlines.push({
        start,
        end,
        element: el,
    });
    }
    return powerlines;
}

/**
 * adapted from <http://stackoverflow.com/questions/26049488/how-to-get-absolute-coordinates-of-object-inside-a-g-group>
 * Yields a function that converts from coordinates relative to the element to
 * those relative to the svg’s root.
 */
function makeConverterToAbsoluteCoords(svgRoot, element) {
  return function(p: Point): Point {
    const offset = svgRoot.getBoundingClientRect();
    const matrix = element.getScreenCTM();
    return {
      x: (matrix.a * p.x) + (matrix.c * p.y) + matrix.e - offset.left,
      y: (matrix.b * p.x) + (matrix.d * p.y) + matrix.f - offset.top
    };
  };
}

function getRectanglesInLayer(svg: SVGSVGElement, layerId: string): Rectangle[] {
  const layer = svg.querySelector("#" + layerId);
  const rectangleElements = layer.getElementsByTagName("rect");
  const rectangleData: Rectangle[] = [];
  for (const el of rectangleElements) {
    const getAttr = (attr: string) => {
      const attrAsStr = valueOr(el.getAttribute(attr), "");
      return valueOr(Number.parseInt(attrAsStr), 0); // parse to number
    };
    const width = getAttr("width");
    const height = getAttr("height");
    const relX = getAttr("x");
    const relY = getAttr("y");
    const toAbs = makeConverterToAbsoluteCoords(svg, el);
    const absCoords = toAbs({x: relX, y: relY});
    rectangleData.push({
      pos: {
        x: absCoords.x,
        y: absCoords.y,
      },
      width,
      height,
      element: el,
    });
  }
  // console.log(hasType(rectangleData));
  return rectangleData;
}
