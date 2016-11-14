export function valueOr<T>(value: T | undefined | null, deflt: T): T {
  return value? value : deflt;
}

export function hasJSType(obj: any) {
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
* Sets up a mark that gets painted every 100ms if the condition
* function returns true.
* Returns a function to stop painting the mark.
*/
export function markCoordsLive(svg: SVGSVGElement, x: number, y: number, condition: () => boolean) {
  let mark;
  const clearMark = () => {
    if(mark) {
      svg.removeChild(mark);
      mark = undefined;
    }
  }
  const updateMark = () => {
    clearMark();
    if(condition()) {
      mark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      mark.setAttribute("cx", x.toString());
      mark.setAttribute("cy", y.toString());
      mark.setAttribute("r", "8");
      mark.style.fill = "#900";
      svg.appendChild(mark);
    }
  }
  const intervalId = setInterval(updateMark, 100);
  return () => {
    clearMark();
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
