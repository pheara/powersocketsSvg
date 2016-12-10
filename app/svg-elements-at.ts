
import {
  toPoints,
  toPath,
} from "svg-points";

import {
  makeConverterToAbsoluteCoords,
  isPointInPoly,
  nodeListToArray,
  makeLocal2VBox,
} from "utils";

/**
  * @param pt the point in viewbox-coordinates (=pre-scaling coords).
  * @param svg the svg-root-element
  * @param exactCollision if false will only check if the point is
             inside the bounding box. if true, additionally it will
             be checked if the point is really inside the element
             itself. This is relevant if you use non-rectangular
             shapes but also incurs additional runtime cost.
             NOTE: currently curvature is ignored, so only `rect`s
             and `path`s consisting of straight lines will be detected
             correctly (the game only consists of these atm, so this
             should be fine for now).
  * adapted from source of
  * <http://xn--dahlstrm-t4a.net/svg/interactivity/intersection/sandbox_hover.svg>
  */
export function svgElementsAt(
  pt: Point,
  svg: SVGSVGElement,
  exactCollision: boolean = true
) {
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

    const boundingBoxIntersections = nodeListToArray(svg.getIntersectionList(svgRect, svg));
    if(!exactCollision) {
      return boundingBoxIntersections;
    } else {
      const exactIntersection = boundingBoxIntersections.filter( el => {

        if(el.tagName === "circle") {
          /*
          * `toPath`/`toPoints` only returns two points for
          * circles. So they would essentially intersect
          * like a line with our point, i.e. not at all.
          */
          return true;
        }

        const shape = toShape(el); // prepare for handing it svg-points
        const localPoints = toPoints(shape);
        const local2VBox = makeLocal2VBox(svg, el);
        const vboxPoints = localPoints.map(
          p => local2VBox({x: p.x, y: p.y})
        );
        return isPointInPoly(vboxPoints, pt);
      });

      return exactIntersection;
    }
}

function toShape(el): any {
  const getNumAttr = attr => Number.parseFloat(el.getAttribute(attr));
  switch(el.tagName) {
    case "path":
      return {
        type: "path",
        d: el.getAttribute("d"),
      };
    case "rect":
      return {
        type: "rect",
        x: getNumAttr("x"),
        y: getNumAttr("y"),
        rx: getNumAttr("rx"), // optional
        ry: getNumAttr("ry"), // optional
        height: getNumAttr("height"),
        width: getNumAttr("width"),
      };
    case "circle":
      return {
        type: "circle",
        r: getNumAttr("r"),
        cx: getNumAttr("cx"),
        cy: getNumAttr("cy"),
      };
    default:
      throw new Error(
        "Can't transform svg-element of type " +
        el.tagName + " into an 'svg-points'-shape yet. " +
        "Check out https://www.npmjs.com/package/svg-points " +
        "for the target format."
      )

  }
}
