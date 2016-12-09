export function valueOr<T>(value: T | undefined | null, deflt: T): T {
  return value? value : deflt;
}

export function hasJSType(type: string, obj: any) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function contains<T>( xs: T[] | Iterable<T>, x: T): boolean {
  if((<T[]>xs).indexOf) {
    // assumes that internal implementation is more optimized
    return (<T[]>xs).indexOf(x) >= 0;
  } else {
    for(const el of xs) {
      if(el === x) return true;
    }
    return false;
  }
}

export function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve, reject) =>
            window.setTimeout(() => resolve(), milliseconds)
    );
}

/**
 * Draws a dark-red circle at the specified coordinates
 * using the viewBox (= pre-mounting) coordinate-system.
 */
export function markCoords(svg: SVGSVGElement, x: number, y: number) {
  //const NS = svg.getAttribute('xmlns'); ---v
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); // Create a path in SVG's namespace
  circle.setAttribute("cx", x.toString());
  circle.setAttribute("cy", y.toString());
  circle.setAttribute("r", "8");
  circle.style.fill = "#900";
  svg.appendChild(circle);
  // console.log(`Marked coordinates (${x}, ${y})`);
}

/**
  * @param pt the point in viewbox-coordinates (=pre-scaling coords).
  * @param svg the svg-root-element
  * adapted from source of
  * <http://xn--dahlstrm-t4a.net/svg/interactivity/intersection/sandbox_hover.svg>
  */
export function svgElementsAt(pt: Point, svg: SVGSVGElement) {
    /*
     * getIntersectionList works on viewport-coordinates
     * we need to transform the svgRects coordinats from
     * viebox (=original) to viewport (=svg after scaling)
     * coordinates.
     */
    const vbox2vportCoords = makeConverterToAbsoluteCoords(svg, svg);
    const vportPt = vbox2vportCoords(pt);

    const svgRect = svg.createSVGRect();
    svgRect.x = vportPt.x;
    svgRect.y = vportPt.y;
    svgRect.width = svgRect.height = 1;

    return svg.getIntersectionList(svgRect, svg);

    //TODO fine-grained collision between paths and the point
    // (`getIntersectionList` only uses the bounding box)

    // const boxCollisions = svg.getIntersectionList(svgRect, svg);
    // return boxCollisions.filter()
    /* path to [{x,y}] or straight up intersection
     * - inkscape can be forced to save absolute path coordinates!
     *     - http://stackoverflow.com/questions/6890685/is-there-a-tool-to-convert-svg-line-paths-from-absolute-to-relative
     *     - path-tutorial: https://developer.mozilla.org/en/docs/Web/SVG/Tutorial/Paths
     * - intersection library: http://www.kevlindev.com/geometry/2D/intersections/index.htm
     *     - on npm: https://www.npmjs.com/package/svg-intersections
     *     - requires preprocessed data that is in the same coordinate-space (which is hard to do with to paths' d-attributes)
     * - svg-points seems to do path<->points: https://www.npmjs.com/package/svg-points#path and https://github.com/colinmeinke/points
     *     - only parses the "d"-attribute without even translating it to element-space coordinates
     * - http://stackoverflow.com/questions/25384052/convert-svg-path-d-attribute-to-a-array-of-points
     * - use switch as clip, then getPointAt #themhacks
     * - getPointAtLength() with polygon resulution
     * - polyfill for the soon-to-be standard https://github.com/jarek-foksa/path-data-polyfill.js
     * - docu for d: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
     * - http://stackoverflow.com/questions/34352624/alternative-for-deprecated-svg-pathseglist/34359059#34359059
     * - path-tutorial: https://www.sitepoint.com/closer-look-svg-path-data/
     *
     * easiest hack: just always return false during the transitions (requires hard-coding them)
    */
}


/**
 * @param poly an array of points with x and y positions which build a closed path.
 * @param pt  the position of the point which we want to check if it is inside the closed path or not. If so, a collision is detected.
 * by Jonas Raoni Soares Silva
 * http://jsfromhell.com/math/is-point-in-poly [rev. #0]
 */
export function isPointInPoly(poly: Array<Point>, pt: Point): boolean {
    let c, i, l, j;
    for(c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
}

/**
 * adapted from <http://stackoverflow.com/questions/26049488/how-to-get-absolute-coordinates-of-object-inside-a-g-group>
 * Yields a function that converts from coordinates relative to the element to
 * those relative to the svg’s root.
 */
export function makeConverterToAbsoluteCoords(svgRoot, element) {
  return function(p: Point): Point {
    const offset = svgRoot.getBoundingClientRect();
    const matrix = element.getScreenCTM();
    return {
      x: (matrix.a * p.x) + (matrix.c * p.y) + matrix.e - offset.left,
      y: (matrix.b * p.x) + (matrix.d * p.y) + matrix.f - offset.top
    };
  };
}

/**
  * adapted from <https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/>
  */
export function makeDOM2VBox(svg: SVGSVGElement) {
  return (pt: Point): Point => {
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = pt.x;
    svgPoint.y = pt.y;
    return svgPoint.matrixTransform(svg.getScreenCTM().inverse());
  }
}

/**
 * Returns the bounding rectangle of the element
 * but in viewbox-coordinates (instead of the usual
 * DOM-coordinates).
 */
export function boundingRectVBox(el: SVGElement, svg: SVGSVGElement) {
    const boundsClientRect = el.getBoundingClientRect();

    const dom2vbox = makeDOM2VBox(svg)
    const leftUpper = dom2vbox({
      x: boundsClientRect.left,
      y: boundsClientRect.top
    });
    const rightLower = dom2vbox({
      x: boundsClientRect.left + boundsClientRect.width,
      y: boundsClientRect.top + boundsClientRect.height,
    });

    const width = rightLower.x - leftUpper.x;
    const height = rightLower.y - leftUpper.y;

    return {
      x: leftUpper.x,
      y: leftUpper.y,
      height,
      width,
    }
}

/**
* Sets up a mark that gets painted every 100ms if the condition
* function returns true.
* Returns a function to stop painting the mark.
*/
export function markCoordsLive(svg: SVGSVGElement, x: number, y: number, condition: () => boolean) {
  let mark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  mark.setAttribute("cx", x.toString());
  mark.setAttribute("cy", y.toString());
  mark.setAttribute("r", "8");
  mark.style.fill = "#900";
  svg.appendChild(mark);

  const updateMark = () => {
    if(condition()) {
      mark.style.display = ""; // not "none"
    } else {
      mark.style.display = "none";
    }
  }
  const intervalId = setInterval(updateMark, 100);
  return () => {
    svg.removeChild(mark);
    clearInterval(intervalId);
  }
}

export function addClientRect(el: SVGElement, svg: SVGSVGElement) {
  const crData = el.getBoundingClientRect()
  const clientRect = document.createElementNS("http://www.w3.org/2000/svg", "rect"); // Create a path in SVG's namespace
  clientRect.setAttribute("x", crData.left.toString());
  clientRect.setAttribute("y", crData.top.toString());
  clientRect.setAttribute("height", crData.height.toString());
  clientRect.setAttribute("width", crData.width.toString());
  clientRect.style.fill = "#0000";
  clientRect.style.stroke = "#900";
  svg.appendChild(clientRect);
  console.log("Added clientRectangle ", /*clientRect,*/ crData);
}

/**
 * Tries to look up a property-path on a nested object-structure.
 * Where `obj.x.y` would throw an exception if `x` wasn't defined
 * `get(obj, ['x','y'])` would return undefined.
 * @param obj
 * @param path
 * @return {*}
 */
export function getIn(obj:any , path: string[]) {
    switch(path.length){
        case 0:
            return undefined;
        case 1:
            return obj && obj[path[0]];
        default:
            return obj && obj[path[0]] && getIn( obj[path[0]] , path.slice(1) )
    }
}

/*
 * Freezes an object recursively.
 *
 * Taken from:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze(obj) {

    // Retrieve the property names defined on obj
    var propNames = Object.getOwnPropertyNames(obj);

    // Freeze properties before freezing self
    propNames.forEach(function(name) {
        var prop = obj[name];

        // Freeze prop if it is an object
        if (typeof prop == 'object' && !Object.isFrozen(prop))
            deepFreeze(prop);
    });

    // Freeze self
    return Object.freeze(obj);
}

export function filterSet(set, f) {
  const resultSet = new Set();
  for(let x of set) {
    if(f(x)) {
      resultSet.add(x);
    }
  }
  return resultSet;
}
