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
} from "utils";

import {
  svgElementsAt,
} from "svg-elements-at";

export function isPowered(
  powerable: Rectangle | Switch,
  map: MapData
): boolean {
  const powered = pathToGenerator(powerable, map);
  return powered.size > 0;
}


export function pathToGenerator(
  powerable: Rectangle | Switch,
  map: MapData,
  visited = new Set<Rectangle | Switch>(),
  powered = new Set<Rectangle | Switch>()
): Set<Rectangle | Switch> { // boolean {
  if (contains(map.generators, powerable)) {
    // reached a generator, stuff is powered.
    powered.add(powerable);
    return powered;
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
        connectedWith.generators.forEach(g => powered.add(g));
        powered.add(powLine);
        powered.add(powerable);
        return powered;
      } else if (connectedWith.switches.length > 0) {
        // markCoords(map.element, otherEnd.x, otherEnd.y);
        for (const swtch of connectedWith.switches) {
          if (!visited.has(swtch)) {
            /* recurse into the switch (but avoid going back).
             * powered elements are added to `powered` by-reference
             */
            pathToGenerator(swtch, map, visited, powered);
            if (powered.has(swtch)) {
              powered.add(swtch);
              powered.add(powerable);
              powered.add(powLine);
              return powered;
            }
          }
        }
      }
    }

    return powered;
  }
}
