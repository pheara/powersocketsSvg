
import {
  toPoints,
} from "svg-points";

import {
  makeConverterToAbsoluteCoords,
  isPointInPoly,
  nodeListToArray,
  makeLocal2VBox,
  deepFreeze,
} from "utils";


const localPointsCache = new Map();
const cachedLocal2VBox = new Map();

/**
  * @param pt the point in viewbox-coordinates (=pre-scaling coords).
  * @param svg the svg-root-element
  * @param config.exactCollision if false will only check if the point is
  *          inside the bounding box. if true, additionally it will
  *          be checked if the point is really inside the element
  *          itself. This is relevant if you use non-rectangular
  *          shapes but also incurs additional runtime cost.
  *          NOTE: currently curvature is ignored, so only `rect`s
  *          and `path`s consisting of straight lines will be detected
  *          correctly (the game only consists of these atm, so this
  *          should be fine for now). Defaults to `true`.
  * @param config.cacheLocalPoints relevant if exactCollsion == true. If the
  *          points themselves in your svg-elements, especially your 
  *          paths, don't change, the parsed results are cached, thus
  *          improving performance. Transformations applied to the
  *          elements themselves (e.g. rotations) will still be 
  *          respected even if this is true. Note that this makes
  *          this function stateful. Defaults to `true`.
  * @param config.onlyUprightRectangles relevant if exactCollision == true. 
  *          If all rectangles in your scene are without rotation, 
  *          their bounding-boxes equal their exact shapes and thus
  *          the costly exact calculation can be skipped. Defaults 
  *          to `true`.
  * @param config.cacheTransformations relevant if exactCollision == true. If
  *          set to `true` (the default) all elements in the scene are assumed
  *          static and the transformation matrices / functions for them are
  *          cached. You can disable the caching for specific elements by 
  *          passing them via `config.dynamicElements`.
  * @param config.dynamicElements see `config.cacheTransformations` above.
  * @param config.resizeHasHappend relevant when using config.staticElements.
  *          if this is set to true, the transformations of all elements
  *          have changed and the cached transformation functions are 
  *          reinitialized.
  *
  * code for this function was adapted from the sources of
  * <http://xn--dahlstrm-t4a.net/svg/interactivity/intersection/sandbox_hover.svg>
  */
export function svgElementsAt(
  pt: Point,
  svg: SVGSVGElement,
  config: {
    exactCollision?: boolean | undefined,
    cacheLocalPoints?: boolean | undefined,
    onlyUprightRectangles?: boolean | undefined,
    cacheTransformations?: boolean | undefined,
    dynamicElements?//: Set<SVGElement> | undefined,
    resizeHasHappened?: boolean | undefined,
  } = {}
) {
    config = Object.assign({
      exactCollision: true,
      cacheLocalPoints: true,
      onlyUprightRectangles: true,
      cacheTransformations: true,
      dynamicElements: new Set(),
      resizeHasHappend: false,
    } , config); // copy the custom config over the defaults

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
    if(!config.exactCollision) {
      return boundingBoxIntersections;
    } else {
      const exactIntersections = boundingBoxIntersections.filter( el => {

        if(el.tagName === "circle") {
          /*
          * `toPoints` only returns two points for
          * circles. So they would essentially intersect
          * like a line with our point, i.e. not at all.
          */
          return true;
        }
        if(config.onlyUprightRectangles && el.tagName === "rect") {
          // for these bounding-box == exact shape
          return true;
        }

        let localPoints;
        if(config.cacheLocalPoints && localPointsCache.has(el)) {
          localPoints = localPointsCache.get(el);
        } else {
          const shape = toShape(el); // prepare for handing it svg-points
          localPoints = toPoints(shape);
          localPointsCache.set(el, localPoints);
        }

        let local2VBox;
        if (!config.cacheTransformations || config.dynamicElements.has(el)) {
          // caching disabled or is a dynamic element.
          // calculate transformations every time
          local2VBox = makeLocal2VBox(svg, el);
        } else if (!cachedLocal2VBox.has(el) || config.resizeHasHappened) {
          // static but not yet in cache or cache invalidated due to resize
          local2VBox = makeLocal2VBox(svg, el);
          cachedLocal2VBox.set(el, local2VBox);
        } else {
          // static and cached
          local2VBox = cachedLocal2VBox.get(el);
        }

        const vboxPoints = localPoints.map(
          p => local2VBox({x: p.x, y: p.y})
        );
        return isPointInPoly(vboxPoints, pt);
      });

      return exactIntersections;
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
