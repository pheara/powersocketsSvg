/// <reference path="declarations.d.ts"/>
import parseSvgPath from "svg-path-parser";
// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

export function fetchMap(url: string) {

  const svgPromise = fetchSvg(url);

  const dataPromise = svgPromise.then((svg: SVGSVGElement) => {

    // start parsing the svg-path data
    const powerlines = getPowerlines(svg);
    const sockets = getRectanglesInLayer(svg, "sockets");
    const generators = getRectanglesInLayer(svg, "generators");

    return {
      powerlines: powerlines,
      sockets: sockets,
      svgElement: svg,
    };

  });

  return dataPromise;
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
  });

  const svgPromise: Promise<SVGSVGElement> = svgXhrPromise
    .then(xhr => xhr.responseXML.documentElement);

  return svgPromise;
}

function getPowerlines(svg: SVGSVGElement) {
    const powerlinesLayer = svg.querySelector("#powerlines");
    const powerlineElements = powerlinesLayer.getElementsByTagName("path");
    const powerlines = [];
    for (const el of powerlineElements) {
      const pathString = el.getAttribute("d");
      const pathList = parseSvgPath(pathString);
      const start = { x: pathList[0].x, y: pathList[0].y };
      const end; //need to deal with relative coords
      powerlines.push(pathList);
    }
    return powerlines;
}

function getRectanglesInLayer(svg: SVGSVGElement, layerId: string) {
  const layer = svg.querySelector("#" + layerId);
  const rectangleElements = layer.getElementsByTagName("rect");
  const rectangleData = [];
  for (const el of rectangleElements) {
    const x = el.getAttribute("x");
    const y = el.getAttribute("y");
    const width = el.getAttribute("width");
    const height = el.getAttribute("height");
    rectangleData.push({x, y, width, height});
  }
  //console.log(hasType(rectangleData));
  return rectangleData;
}

function hasType(obj: any) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}
