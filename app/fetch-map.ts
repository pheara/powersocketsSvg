/// <reference path="declarations.d.ts"/>
// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

import {
  valueOr,
  hasJSType,
  delay,
  deepFreeze,
  makeConverterToAbsoluteCoords,
  makeDOM2VBox,
  boundingRectVBox,
 } from "utils";


export function loadMap(url: string, mountpoint: string) : Promise<MapData> {
  const mapDataPromise = fetchSvg(url).then(svg => {
    const backgroundDiv = document.getElementById(mountpoint);
    if (backgroundDiv) {
      /**
       * Some parsing needs to happen before mounting,
       * as at that point the coordinate-systems for
       * the viewBox (coordinates used to draw the svg,
       * as specified in the root-element's property)
       * and viewport (the piece user's get to see,
       * including any scaling due to the screen's width)
       * see: <https://sarasoueidan.com/blog/svg-coordinate-systems/>
       */
      const data = extractMapData(svg);

      //delay(2000).then(() =>
      //  console.log("map-data reextracted: ", extractMapData(svg))
      //)

      let rect = data.sockets[0];
      let toAbs = makeConverterToAbsoluteCoords(svg, rect.element);
      console.log("to abs 1: ", toAbs(rect.pos));
      console.log("to abs 1: ", toAbs({x: 0, y: 0}));
      console.log("to abs 1: ", toAbs({x: 1, y: 1}));

      /*
       * mount the svg
       */
      backgroundDiv.appendChild(svg);

      toAbs = makeConverterToAbsoluteCoords(svg, rect.element);
      console.log("to abs 2: ", toAbs(rect.pos)); // doesn't match up with the same vec above
      console.log("to abs 2: ", toAbs({x: 0, y: 0}));
      console.log("to abs 2: ", toAbs({x: 1, y: 1}));

      /*
       * some parsing needs to happen after mounting,
       * e.g. clientRectangles (~bounding boxes) only
       * have a non-zero size then.
       */
      parseAndSetRotationPivots(data);

      return data;
    } else {
      throw new Error(
        `Couldn't mount map "${url}" at mountpoint with id "${mountpoint}".`
      );
    }
  });
  return mapDataPromise;
}

export function fetchSvg(url: string): Promise<SVGSVGElement> {
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
        console.log(`SVG request for ${url} was successful: `, xhr);
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

/**
 * Extracts coordinates in viewport-space(!)
 * and sizes for all game-elements. If you call
 * this after scaling the svg, the results won't
 * match the viewbox-coordinates any more.
 */
function extractMapData(svg: SVGSVGElement): MapData {
  const powerlines = getPowerlines(svg);
  const switches = getSwitches(svg);
  const sockets = getRectanglesInLayer(svg, "sockets");
  const generators = getRectanglesInLayer(svg, "generators");

  console.log("before mount: ", powerlines[0]);
  delay(1000).then(() => {
    console.log("after mount: ", getPowerlines(svg)[0]);
  });

  return {
    powerlines,
    generators,
    sockets,
    switches,
    element: svg,
  };
}
function parseAndSetRotationPivots(data: MapData) {
  for (const s of data.switches) {
    const el = s.element;

    const getAttr = (attr: string) => {
      const attrAsStr = valueOr(el.getAttribute(attr), "");
      return valueOr(Number.parseInt(attrAsStr), 0); // parse to number
    };
    /*
     * offset of rotation pivot from center (not the left-upper corner)
     * positive y is up(!), positive x is to the right
     */
    const center2pivot = {
      x: getAttr("inkscape:transform-center-x"),
      y: getAttr("inkscape:transform-center-y"),
    };

    const bounds = boundingRectVBox(el, data.element);

    const transformOrigin = { // preparation for the css class
      x: 1 / 2 + (center2pivot.x / bounds.width),
      y: 1 / 2 - (center2pivot.y / bounds.height),
    };
    el.style.transformOrigin =
      (transformOrigin.x * 100).toString() + "% " +
      (transformOrigin.y * 100).toString() + "%";
  }
}


function getSwitches(svg: SVGSVGElement): Switch[] {
  const layer = svg.querySelector("#switches");
  const elements = layer.getElementsByTagName("path");
  const switches: Switch[] = [];
  for (const el of elements) {
    switches.push({
      element: el,
    });
  }
  return switches;
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
    rectangleData.push({
      pos: toAbs({x: relX, y: relY}),
      width,
      height,
      element: el,
    });
  }
  // console.log(hasType(rectangleData));
  return rectangleData;
}
