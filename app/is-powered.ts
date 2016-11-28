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
} from "utils";

export function isPowered(
  powerable: Rectangle | Switch,
  map: MapData,
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

      // markCoords(map.element, otherEnd.x, otherEnd.y);
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
        }
      }
    }

    return false;
  }
}
