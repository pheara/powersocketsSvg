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
 * Draws a dark-red circle at the specified coordinates.
 */
export function markCoords(svg: SVGSVGElement, x: number, y: number) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); // Create a path in SVG's namespace
  circle.setAttribute("cx", x.toString());
  circle.setAttribute("cy", y.toString());
  circle.setAttribute("r", "8");
  circle.style.fill = "#900";
  svg.appendChild(circle);
}

/**
  * adapted from source of
  * <http://xn--dahlstrm-t4a.net/svg/interactivity/intersection/sandbox_hover.svg>
  */
export function svgElementsAt(pt: Point, svg: SVGSVGElement) {
    const svgRect = svg.createSVGRect();
    svgRect.x = pt.x;
    svgRect.y = pt.y;
    svgRect.width = svgRect.height = 1;
    // let list = svg.getIntersectionList(svgRect, null);
    return svg.getIntersectionList(svgRect, svg);
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
