
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
    // TODO the change might break isPowered as powerlines are impossible to hit now


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
