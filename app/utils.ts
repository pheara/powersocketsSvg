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
