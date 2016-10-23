/// <reference path="declarations.d.ts"/>
import parseSvgPath from "svg-path-parser";
// import fetch from "fetch";
import "fetch";
declare var fetch; // sadly there's no .d.ts file for fetch

export function fetchMap(url: string) {

  const svgXmlPromise = new Promise<XMLHttpRequest>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
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
  });

  const dataPromise = svgXmlPromise.then((xhr: XMLHttpRequest) => {
    const svgElement = xhr.responseXML.documentElement;
    // start parsing the svg-path data
    const pathElements = svgElement.getElementsByTagName("path");
    const paths = [];
    for (const el of pathElements) {
      const pathString = el.getAttribute("d");
      const pathList = parseSvgPath(pathString);
      paths.push(pathList);
    }

    const rectElements = svgElement.getElementsByTagName("rect");
    const rectangles = [];
    for (const el of rectElements) {
      const x = el.getAttribute("x");
      const y = el.getAttribute("y");
      const width = el.getAttribute("width");
      const height = el.getAttribute("height");
      rectangles.push({x, y, width, height});
    }

    return {
      paths: paths,
      rectangles: rectangles,
      svgElement: svgElement,
    };

  });

  return dataPromise;

}
