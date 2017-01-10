import {
  hasJSType,
  contains,
  markCoords,
  markCoordsLive,
} from "utils";

import {
  svgElementsAt,
  pointInSvgElement,
} from "svg-elements-at";

/**
 * @param map
 * @param pt x- and y- coordinates in vbox-
 *           coordinates (=the original svg coordinates)
 */
export function piecesAt(map: MapData, pt: Point) {
  const svg = map.element;

  const dynamicElements = selectDynamicElements(map);

  // TODO detect resize and pass on resizeHasHappened

  const intersectedElements = svgElementsAt(pt, svg, { dynamicElements } );
  return {
    generators: map.generators.filter(g =>
      contains(intersectedElements, g.element)
    ),
    sockets: map.sockets.filter(s =>
      contains(intersectedElements, s.element)
    ),
    switches: map.switches.filter(s =>
      contains(intersectedElements, s.element)
    ),
  };
}

function selectDynamicElements(map: MapData) {
  return selectElementsFrom([map.switches]);
}
function selectStaticElements(map: MapData) {
  return selectElementsFrom([
    map.powerlines, 
    map.generators, 
    map.sockets,
  ]);
}

function selectElementsFrom(collectionsOfPieces) {
  const selectedElements = new Set();

  collectionsOfPieces.forEach((pieces: Array<Rectangle | Powerline>) => 
    pieces && pieces.forEach(
      p => selectedElements.add(p.element)
    )
  );

  return selectedElements;

}

/**
 * Returns the powerlines connectected to a Generator/Socket/Switch
 */
export function selectAttachedLines(piece: Rectangle | Switch, map: MapData): Powerline[] {
  return map.powerlines.filter(p =>
    attachedToShape(p, piece, map)
  );
}

export function attached(rect: Rectangle, powerline: Powerline): boolean {
    return insideRect(rect, powerline.start) || insideRect(rect, powerline.end);
}

export function attachedToShape(powerline: Powerline, shape: Rectangle | Switch, map: MapData) {
  return insideShape(powerline.start, shape, map) ||
         insideShape(powerline.end, shape, map);
}

export function insideShape(point: Point, shape: Rectangle | Switch, map: MapData): boolean {
  const dynamicElements = selectDynamicElements(map);

  // TODO detect resize and pass on resizeHasHappened
  
  return pointInSvgElement(
    point, shape.element, map.element, 
    { dynamicElements }
  );
}

export function insideRect(rect: Rectangle, point: Point): boolean {
    return rect.pos.x <= point.x &&
           point.x <= rect.pos.x + rect.width &&
           rect.pos.y <= point.y &&
           point.y <= rect.pos.y + rect.height;
}
