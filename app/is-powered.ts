import {
  piecesAt,
  selectAttachedLines,
  attached,
  attachedToShape,
  insideShape,
  insideRect,
} from "geometry";

import {
  hasJSType,
  contains,
  markCoords,
  markCoordsLive,
  svgElementsAt,
  vibrate,
} from "utils";

export function isPowered(
  powerable: Rectangle | Switch,
  map,
  visited = new Set<Rectangle | Switch>()
): boolean {
  if (contains(map.generators, powerable)) {
    // reached a generator, stuff is powered.
    return true;
  } else { // switch or socket

    visited.add(powerable);
    const attachedLines = selectAttachedLines(powerable, map);
    for (const powLine of attachedLines) {
      const otherEnd: Point =
        insideShape(powLine.end, powerable, map.element) ?
          powLine.start :
          powLine.end;
      const connectedWith = piecesAt(map, otherEnd);

      // console.log("powerable attached to: ", connectedWith.generators, connectedWith.switches);

      if (connectedWith.generators.length > 0) {
        // markCoords(map.element, otherEnd.x, otherEnd.y);
        return true;
      } else if (connectedWith.switches.length > 0) {
        // markCoords(map.element, otherEnd.x, otherEnd.y);
        for (const swtch of connectedWith.switches) {
          // recurse into the switch (but avoid going back)
          if (!visited.has(swtch) && isPowered(swtch, map, visited)) {
            return true;
          }
          // ...const otherEnd... (recurses)
          // make this a recursive function and merge everything into a set of visited nodes.
          // TODO a) we don't need immutable, there's `Set`s in vanilla-js
          // TODO b) isPowered should be a function that accepts anything (powline/socket/gen/switch)
          /* TODO extend so it takes all elements
            generator -> true
            powerline -> true if connected to a generator or powered switch
            switch | socket -> true if connected to a powered line

              where connected: a powerline-endpoints is within the rect-element/switch-path-element
          */
        }
      }
    }

    return false;
  }
}
