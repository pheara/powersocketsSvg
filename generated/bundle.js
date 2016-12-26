System.register("utils", [], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function valueOr(value, deflt) {
        return value ? value : deflt;
    }
    exports_1("valueOr", valueOr);
    function hasJSType(type, obj) {
        return Object.prototype.toString.call(obj).slice(8, -1) === type;
    }
    exports_1("hasJSType", hasJSType);
    function contains(xs, x) {
        if (xs.indexOf) {
            // assumes that internal implementation is more optimized
            return xs.indexOf(x) >= 0;
        }
        else {
            for (const el of xs) {
                if (el === x)
                    return true;
            }
            return false;
        }
    }
    exports_1("contains", contains);
    function delay(milliseconds) {
        return new Promise((resolve, reject) => window.setTimeout(() => resolve(), milliseconds));
    }
    exports_1("delay", delay);
    /**
     * Draws a dark-red circle at the specified coordinates
     * using the viewBox (= pre-mounting) coordinate-system.
     */
    function markCoords(svg, x, y) {
        // const NS = svg.getAttribute('xmlns'); ---v
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); // Create a path in SVG's namespace
        circle.setAttribute("cx", x.toString());
        circle.setAttribute("cy", y.toString());
        circle.setAttribute("r", "8");
        circle.style.fill = "#900";
        svg.appendChild(circle);
        // console.log(`Marked coordinates (${x}, ${y})`);
    }
    exports_1("markCoords", markCoords);
    /**
     * @param poly an array of points with x and y positions which build a closed path.
     * @param pt  the position of the point which we want to check if it is inside the closed path or not. If so, a collision is detected.
     * by Jonas Raoni Soares Silva
     * http://jsfromhell.com/math/is-point-in-poly [rev. #0]
     */
    function isPointInPoly(poly, pt) {
        let c, i, l, j;
        for (c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
                && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
                && (c = !c);
        return c;
    }
    exports_1("isPointInPoly", isPointInPoly);
    /**
     * Turns anything that supports for-of
     * into an array.
     */
    function nodeListToArray(nodeList) {
        const arr = new Array(nodeList.length);
        for (let i = 0; i < nodeList.length; i++) {
            arr[i] = nodeList[i];
        }
        return arr;
    }
    exports_1("nodeListToArray", nodeListToArray);
    /**
     * adapted from <http://stackoverflow.com/questions/26049488/how-to-get-absolute-coordinates-of-object-inside-a-g-group>
     * Yields a function that converts from coordinates relative to the element to
     * those relative to the svg’s root.
     */
    function makeConverterToAbsoluteCoords(svgRoot, element) {
        return function (p) {
            const offset = svgRoot.getBoundingClientRect();
            const matrix = element.getScreenCTM();
            return {
                x: (matrix.a * p.x) + (matrix.c * p.y) + matrix.e - offset.left,
                y: (matrix.b * p.x) + (matrix.d * p.y) + matrix.f - offset.top
            };
        };
    }
    exports_1("makeConverterToAbsoluteCoords", makeConverterToAbsoluteCoords);
    /**
     * @returns a function that converts points from an elements
     *          own/local coordinate system, to their equivalent
     *          viewbox-coordinates (viewbox = the svg's original
     *          coordinate-system)
     */
    function makeLocal2VBox(svgRoot, element) {
        return (p) => {
            const svgPoint = svgRoot.createSVGPoint();
            svgPoint.x = p.x;
            svgPoint.y = p.y;
            return svgPoint
                .matrixTransform(element.getCTM())
                .matrixTransform(svgRoot.getCTM().inverse());
        };
    }
    exports_1("makeLocal2VBox", makeLocal2VBox);
    /**
      * adapted from <https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/>
      */
    function makeDOM2VBox(svg) {
        return (pt) => {
            const svgPoint = svg.createSVGPoint();
            svgPoint.x = pt.x;
            svgPoint.y = pt.y;
            return svgPoint.matrixTransform(svg.getScreenCTM().inverse());
        };
    }
    exports_1("makeDOM2VBox", makeDOM2VBox);
    /**
     * Returns the bounding rectangle of the element
     * but in viewbox-coordinates (instead of the usual
     * DOM-coordinates).
     */
    function boundingRectVBox(el, svg) {
        const boundsClientRect = el.getBoundingClientRect();
        const dom2vbox = makeDOM2VBox(svg);
        const leftUpper = dom2vbox({
            x: boundsClientRect.left,
            y: boundsClientRect.top
        });
        const rightLower = dom2vbox({
            x: boundsClientRect.left + boundsClientRect.width,
            y: boundsClientRect.top + boundsClientRect.height,
        });
        const width = rightLower.x - leftUpper.x;
        const height = rightLower.y - leftUpper.y;
        return {
            x: leftUpper.x,
            y: leftUpper.y,
            height,
            width,
        };
    }
    exports_1("boundingRectVBox", boundingRectVBox);
    /**
    * Sets up a mark that gets painted every 100ms if the condition
    * function returns true.
    * Returns a function to stop painting the mark.
    */
    function markCoordsLive(svg, x, y, condition) {
        let mark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        mark.setAttribute("cx", x.toString());
        mark.setAttribute("cy", y.toString());
        mark.setAttribute("r", "8");
        mark.style.fill = "#900";
        svg.appendChild(mark);
        const updateMark = () => {
            if (condition()) {
                mark.style.display = ""; // not "none"
            }
            else {
                mark.style.display = "none";
            }
        };
        const intervalId = setInterval(updateMark, 100);
        return () => {
            svg.removeChild(mark);
            clearInterval(intervalId);
        };
    }
    exports_1("markCoordsLive", markCoordsLive);
    function addClientRect(el, svg) {
        const crData = el.getBoundingClientRect();
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
    exports_1("addClientRect", addClientRect);
    /**
     * Tries to look up a property-path on a nested object-structure.
     * Where `obj.x.y` would throw an exception if `x` wasn't defined
     * `get(obj, ['x','y'])` would return undefined.
     * @param obj
     * @param path
     * @return {*}
     */
    function getIn(obj, path) {
        switch (path.length) {
            case 0:
                return undefined;
            case 1:
                return obj && obj[path[0]];
            default:
                return obj && obj[path[0]] && getIn(obj[path[0]], path.slice(1));
        }
    }
    exports_1("getIn", getIn);
    /*
     * Freezes an object recursively.
     *
     * Taken from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
     */
    function deepFreeze(obj) {
        if (hasJSType("Array", obj)) {
            for (const el of obj) {
                deepFreeze(el);
            }
        }
        else if (hasJSType("Object", obj)) {
            // Retrieve the property names defined on obj
            let propNames = Object.getOwnPropertyNames(obj);
            // Freeze properties before freezing self
            propNames.forEach(function (name) {
                let prop = obj[name];
                // Freeze prop if it is an object
                if (typeof prop === "object" && !Object.isFrozen(prop))
                    deepFreeze(prop);
            });
        }
        // Freeze self
        return Object.freeze(obj);
    }
    exports_1("deepFreeze", deepFreeze);
    function filterSet(set, f) {
        const resultSet = new Set();
        for (let x of set) {
            if (f(x)) {
                resultSet.add(x);
            }
        }
        return resultSet;
    }
    exports_1("filterSet", filterSet);
    function mapToMap(arr, f) {
        const result = new Map();
        for (const x of arr) {
            result.set(x, f(x));
        }
        return result;
    }
    exports_1("mapToMap", mapToMap);
    return {
        setters:[],
        execute: function() {
        }
    }
});
System.register("config", ["utils"], function(exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var utils_1;
    var happyColor, shockColor, defaultColor, maxFps, shockDuration, levels;
    return {
        setters:[
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }],
        execute: function() {
            exports_2("happyColor", happyColor = "#3cd348"); // light green
            exports_2("shockColor", shockColor = "#f9321d"); // almost pure red
            exports_2("defaultColor", defaultColor = "#dadada"); // light grey
            exports_2("maxFps", maxFps = 10);
            exports_2("shockDuration", shockDuration = 0.9); // in seconds
            exports_2("levels", levels = utils_1.deepFreeze([
                {
                    timeLimit: 30,
                    initialPoints: 30,
                    shockPenalty: 27,
                    missedOpportunityPenalty: 10,
                    takenOpportunityPoints: 20,
                },
                {
                    timeLimit: 30,
                    initialPoints: 30,
                    shockPenalty: 28,
                    missedOpportunityPenalty: 6,
                    takenOpportunityPoints: 12,
                },
                {
                    timeLimit: 30,
                    initialPoints: 30,
                    shockPenalty: 10,
                    missedOpportunityPenalty: 2,
                    takenOpportunityPoints: 17,
                },
                {
                    timeLimit: 30,
                    initialPoints: 30,
                    shockPenalty: 30,
                    missedOpportunityPenalty: 8,
                    takenOpportunityPoints: 12,
                },
                {
                    timeLimit: 30,
                    initialPoints: 30,
                    shockPenalty: 31,
                    missedOpportunityPenalty: 8,
                    takenOpportunityPoints: 12,
                },
                {
                    timeLimit: 30,
                    initialPoints: 30,
                    shockPenalty: 31,
                    missedOpportunityPenalty: 5,
                    takenOpportunityPoints: 8,
                },
                {
                    timeLimit: 999999,
                    initialPoints: 0,
                    shockPenalty: 0,
                    missedOpportunityPenalty: 0,
                    takenOpportunityPoints: 0,
                },
            ]));
        }
    }
});
System.register("fetch-map", ["fetch", "utils"], function(exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var utils_2;
    function loadMap(url, mountpoint) {
        const mapDataPromise = fetchSvg(url).then(svg => {
            const backgroundDiv = document.getElementById(mountpoint);
            if (backgroundDiv) {
                /**
                 * Some parsing needs to happen before mounting,
                 * as at that point the coordinate-systems for
                 * the viewBox (coordinates used to draw the svg,
                 * as specified in the root-element's property)
                 * and viewport (the piece user's get to see,
                 * including any scaling due to the screen's width)
                 * see: <https://sarasoueidan.com/blog/svg-coordinate-systems/>
                 */
                const data = extractMapData(svg);
                //delay(2000).then(() =>
                //  console.log("map-data reextracted: ", extractMapData(svg))
                //)
                /*
                let rect = data.sockets[0];
                let toAbs = makeConverterToAbsoluteCoords(svg, rect.element);
                console.log("to abs 1: ", toAbs(rect.pos));
                console.log("to abs 1: ", toAbs({x: 0, y: 0}));
                console.log("to abs 1: ", toAbs({x: 1, y: 1}));
                */
                /*
                 * mount the svg
                 */
                backgroundDiv.appendChild(svg);
                /*
                toAbs = makeConverterToAbsoluteCoords(svg, rect.element);
                console.log("to abs 2: ", toAbs(rect.pos)); // doesn't match up with the same vec above
                console.log("to abs 2: ", toAbs({x: 0, y: 0}));
                console.log("to abs 2: ", toAbs({x: 1, y: 1}));
                */
                /*
                 * some parsing needs to happen after mounting,
                 * e.g. clientRectangles (~bounding boxes) only
                 * have a non-zero size then.
                 */
                parseAndSetRotationPivots(data);
                return data;
            }
            else {
                throw new Error(`Couldn't mount map "${url}" at mountpoint with id "${mountpoint}".`);
            }
        });
        return mapDataPromise;
    }
    exports_3("loadMap", loadMap);
    function fetchSvg(url) {
        const svgXhrPromise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            // Following line is just to be on the safe side;
            // not needed if your server delivers SVG with correct MIME type
            xhr.overrideMimeType("image/svg+xml");
            xhr.send("");
            xhr.onload = (e) => {
                if (xhr.status === 200) {
                    // console.log(xhr.responseText);
                    console.log(`SVG request for ${url} was successful: `, xhr);
                    resolve(xhr);
                }
                else {
                    console.error(xhr.statusText, xhr);
                    reject(xhr);
                }
            };
        });
        const svgPromise = svgXhrPromise
            .then(xhr => xhr.responseXML.documentElement);
        return svgPromise;
    }
    exports_3("fetchSvg", fetchSvg);
    /**
     * Extracts coordinates in viewport-space(!)
     * and sizes for all game-elements. If you call
     * this after scaling the svg, the results won't
     * match the viewbox-coordinates any more.
     */
    function extractMapData(svg) {
        const powerlines = getPowerlines(svg);
        const switches = getSwitches(svg);
        const sockets = getRectanglesInLayer(svg, "sockets");
        const generators = getRectanglesInLayer(svg, "generators");
        console.log("before mount: ", powerlines[0]);
        utils_2.delay(1000).then(() => {
            console.log("after mount: ", getPowerlines(svg)[0]);
        });
        return {
            powerlines,
            generators,
            sockets,
            switches,
            element: svg,
        };
    }
    function parseAndSetRotationPivots(data) {
        for (const s of data.switches) {
            const el = s.element;
            const getAttr = (attr) => {
                const attrAsStr = utils_2.valueOr(el.getAttribute(attr), "");
                return utils_2.valueOr(Number.parseInt(attrAsStr), 0); // parse to number
            };
            /*
             * offset of rotation pivot from center (not the left-upper corner)
             * positive y is up(!), positive x is to the right
             */
            const center2pivot = {
                x: getAttr("inkscape:transform-center-x"),
                y: getAttr("inkscape:transform-center-y"),
            };
            const bounds = utils_2.boundingRectVBox(el, data.element);
            const transformOrigin = {
                x: 1 / 2 + (center2pivot.x / bounds.width),
                y: 1 / 2 - (center2pivot.y / bounds.height),
            };
            el.style.transformOrigin =
                (transformOrigin.x * 100).toString() + "% " +
                    (transformOrigin.y * 100).toString() + "%";
        }
    }
    function getSwitches(svg) {
        const layer = svg.querySelector("#switches");
        const elements = layer.getElementsByTagName("path");
        const switches = [];
        for (const el of elements) {
            switches.push({
                element: el,
            });
        }
        return switches;
    }
    function getPowerlines(svg) {
        const powerlinesLayer = svg.querySelector("#powerlines");
        const powerlineElements = powerlinesLayer.getElementsByTagName("path");
        const powerlines = [];
        for (const el of powerlineElements) {
            const toAbs = utils_2.makeConverterToAbsoluteCoords(svg, el);
            const start = toAbs(el.getPointAtLength(0));
            const end = toAbs(el.getPointAtLength(el.getTotalLength()));
            powerlines.push({
                start,
                end,
                element: el,
            });
        }
        return powerlines;
    }
    function getRectanglesInLayer(svg, layerId) {
        const layer = svg.querySelector("#" + layerId);
        const rectangleElements = layer.getElementsByTagName("rect");
        const rectangleData = [];
        for (const el of rectangleElements) {
            const getAttr = (attr) => {
                const attrAsStr = utils_2.valueOr(el.getAttribute(attr), "");
                return utils_2.valueOr(Number.parseInt(attrAsStr), 0); // parse to number
            };
            const width = getAttr("width");
            const height = getAttr("height");
            const relX = getAttr("x");
            const relY = getAttr("y");
            const toAbs = utils_2.makeConverterToAbsoluteCoords(svg, el);
            rectangleData.push({
                pos: toAbs({ x: relX, y: relY }),
                width,
                height,
                element: el,
            });
        }
        // console.log(hasType(rectangleData));
        return rectangleData;
    }
    return {
        setters:[
            function (_1) {},
            function (utils_2_1) {
                utils_2 = utils_2_1;
            }],
        execute: function() {
        }
    }
});
System.register("svg-elements-at", ["svg-points", "utils"], function(exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var svg_points_1, utils_3;
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
    function svgElementsAt(pt, svg, exactCollision = true) {
        /*
         * getIntersectionList works on viewport-coordinates
         * we need to transform the svgRects coordinats from
         * viebox (=original) to viewport (=svg after scaling)
         * coordinates.
         */
        const vbox2vportCoords = utils_3.makeConverterToAbsoluteCoords(svg, svg);
        const vportPt = vbox2vportCoords(pt);
        const svgRect = svg.createSVGRect();
        svgRect.x = vportPt.x;
        svgRect.y = vportPt.y;
        svgRect.width = svgRect.height = 1;
        const boundingBoxIntersections = utils_3.nodeListToArray(svg.getIntersectionList(svgRect, svg));
        if (!exactCollision) {
            return boundingBoxIntersections;
        }
        else {
            const exactIntersection = boundingBoxIntersections.filter(el => {
                if (el.tagName === "circle") {
                    /*
                    * `toPath`/`toPoints` only returns two points for
                    * circles. So they would essentially intersect
                    * like a line with our point, i.e. not at all.
                    */
                    return true;
                }
                const shape = toShape(el); // prepare for handing it svg-points
                const localPoints = svg_points_1.toPoints(shape);
                const local2VBox = utils_3.makeLocal2VBox(svg, el);
                const vboxPoints = localPoints.map(p => local2VBox({ x: p.x, y: p.y }));
                return utils_3.isPointInPoly(vboxPoints, pt);
            });
            return exactIntersection;
        }
    }
    exports_4("svgElementsAt", svgElementsAt);
    function toShape(el) {
        const getNumAttr = attr => Number.parseFloat(el.getAttribute(attr));
        switch (el.tagName) {
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
                    rx: getNumAttr("rx"),
                    ry: getNumAttr("ry"),
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
                throw new Error("Can't transform svg-element of type " +
                    el.tagName + " into an 'svg-points'-shape yet. " +
                    "Check out https://www.npmjs.com/package/svg-points " +
                    "for the target format.");
        }
    }
    return {
        setters:[
            function (svg_points_1_1) {
                svg_points_1 = svg_points_1_1;
            },
            function (utils_3_1) {
                utils_3 = utils_3_1;
            }],
        execute: function() {
        }
    }
});
System.register("geometry", ["utils", "svg-elements-at"], function(exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var utils_4, svg_elements_at_1;
    /**
     * @param map
     * @param pt x- and y- coordinates in vbox-
     *           coordinates (=the original svg coordinates)
     */
    function piecesAt(map, pt) {
        const svg = map.element;
        const intersectedElements = svg_elements_at_1.svgElementsAt(pt, svg);
        return {
            generators: map.generators.filter(g => utils_4.contains(intersectedElements, g.element)),
            sockets: map.sockets.filter(s => utils_4.contains(intersectedElements, s.element)),
            switches: map.switches.filter(s => utils_4.contains(intersectedElements, s.element)),
        };
    }
    exports_5("piecesAt", piecesAt);
    /**
     * Returns the powerlines connectected to a Generator/Socket/Switch
     */
    function selectAttachedLines(piece, map) {
        return map.powerlines.filter(p => attachedToShape(p, piece, map.element));
    }
    exports_5("selectAttachedLines", selectAttachedLines);
    function attached(rect, powerline) {
        return insideRect(rect, powerline.start) || insideRect(rect, powerline.end);
    }
    exports_5("attached", attached);
    function attachedToShape(powerline, shape, svg) {
        return insideShape(powerline.start, shape, svg) ||
            insideShape(powerline.end, shape, svg);
    }
    exports_5("attachedToShape", attachedToShape);
    function insideShape(point, shape, svg) {
        return utils_4.contains(svg_elements_at_1.svgElementsAt(point, svg), shape.element);
    }
    exports_5("insideShape", insideShape);
    function insideRect(rect, point) {
        return rect.pos.x <= point.x &&
            point.x <= rect.pos.x + rect.width &&
            rect.pos.y <= point.y &&
            point.y <= rect.pos.y + rect.height;
    }
    exports_5("insideRect", insideRect);
    return {
        setters:[
            function (utils_4_1) {
                utils_4 = utils_4_1;
            },
            function (svg_elements_at_1_1) {
                svg_elements_at_1 = svg_elements_at_1_1;
            }],
        execute: function() {
        }
    }
});
System.register("is-powered", ["geometry", "utils"], function(exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var geometry_1, utils_5;
    function isPowered(powerable, map) {
        const powered = pathToGenerator(powerable, map);
        return powered.size > 0;
    }
    exports_6("isPowered", isPowered);
    function pathToGenerator(powerable, map, visited = new Set(), powered = new Set()) {
        if (utils_5.contains(map.generators, powerable)) {
            // reached a generator, stuff is powered.
            powered.add(powerable);
            visited.add(powerable);
            return powered;
        }
        else {
            visited.add(powerable);
            const attachedLines = geometry_1.selectAttachedLines(powerable, map);
            for (const powLine of attachedLines) {
                const otherEnd = geometry_1.insideShape(powLine.end, powerable, map.element) ?
                    powLine.start :
                    powLine.end;
                const connectedWith = geometry_1.piecesAt(map, otherEnd);
                visited.add(powLine);
                // markCoords(map.element, otherEnd.x, otherEnd.y);
                // console.log("powerable attached to: ", connectedWith.generators, connectedWith.switches);
                /*
                TODO search the whole map for the sake of the color highlight
                even if one path leads to a generator early on
                */
                if (connectedWith.generators.length > 0) {
                    // markCoords(map.element, otherEnd.x, otherEnd.y);
                    connectedWith.generators.forEach(g => {
                        powered.add(g);
                        visited.add(g);
                    });
                    powered.add(powLine);
                    powered.add(powerable);
                    return powered;
                }
                else if (connectedWith.switches.length > 0) {
                    // markCoords(map.element, otherEnd.x, otherEnd.y);
                    for (const swtch of connectedWith.switches) {
                        if (!visited.has(swtch)) {
                            /* recurse into the switch (but avoid going back).
                             * powered elements are added to `powered` by-reference
                             */
                            pathToGenerator(swtch, map, visited, powered);
                            if (powered.has(swtch)) {
                                visited.add(swtch);
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
    exports_6("pathToGenerator", pathToGenerator);
    return {
        setters:[
            function (geometry_1_1) {
                geometry_1 = geometry_1_1;
            },
            function (utils_5_1) {
                utils_5 = utils_5_1;
            }],
        execute: function() {
        }
    }
});
System.register("run-game-loop", [], function(exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    var gameLoopTimeoutId, stopRequested, previousUpdateTime;
    /**
     * @param gameLoop a function that gets deltaT passed in
     * @return a function to stop the gameloop.
     */
    function runGameLoop(gameLoop, maxFps) {
        // ): DregisterFun {
        const deltaT = getDeltaT();
        const frameStart = Date.now();
        // if set to true due to caller or
        // the gameLoop-Function using
        // the unregister/stop-callback
        // the timeout won't be requeued
        stopRequested = false;
        /*
         * All the game-logic around scoring and GUI-updates
         */
        gameLoop(deltaT, stopGameLoop);
        /*
         * requeue next update with variable delay to get capped fps
         */
        let waitDuration;
        if (maxFps) {
            const frameEnd = Date.now();
            const frameDuration = frameEnd - frameStart;
            const framePlusWait = 1000 / maxFps;
            waitDuration = framePlusWait - frameDuration;
            waitDuration = Math.max(0, waitDuration); // for maxFps === 10: limit to 0-100ms, i.e. <10fps
        }
        else {
            waitDuration = 0;
        }
        if (!stopRequested) {
            gameLoopTimeoutId = setTimeout(() => runGameLoop(gameLoop, maxFps), waitDuration);
        }
        // uregister; will use the latest gameLoopTimeoutId
        return stopGameLoop;
    }
    exports_7("runGameLoop", runGameLoop);
    function stopGameLoop() {
        clearTimeout(gameLoopTimeoutId);
        stopRequested = true;
    }
    function getDeltaT() {
        const currentTime = Date.now();
        if (!previousUpdateTime) {
            previousUpdateTime = currentTime;
        }
        const deltaT = currentTime - previousUpdateTime;
        previousUpdateTime = Date.now();
        return deltaT;
    }
    return {
        setters:[],
        execute: function() {
            ;
            stopRequested = false;
        }
    }
});
// custom declarations / headers
/// <reference path="declarations.d.ts"/>
System.register("main", ["fetch", "geometry", "is-powered", "fetch-map", "run-game-loop", "svg-elements-at", "utils", "config"], function(exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    var geometry_2, is_powered_1, fetch_map_1, run_game_loop_1, svg_elements_at_2, utils_6, conf;
    var scoreEl, score, points, pointsTimerId, stopGameLoop, timeLeftEl, fpsEl, progressEl, pointsIncEl, pointsDecEl, timeLevel, currentMapData, unregisterDebugMarker, touchedSockets, levelTimerId, currentLevelNr, iconPrototypes, iconElements, currentlyShockedPieces, shockedSvgP, happySvgP, boredSvgP;
    /*
     * establish default values to what they should
     * be at the start of a level.
     */
    function resetLevelData() {
        timeLevel = conf.levels[currentLevelNr].timeLimit;
        points = conf.levels[currentLevelNr].initialPoints;
        updateProgressBar(points);
    }
    /*
     * unregister previous callbacks and unmount
     * the map if they're set
     */
    function unregisterPrevious() {
        touchedSockets.clear();
        unregisterDebugMarkers();
        if (pointsTimerId !== undefined) {
            clearInterval(pointsTimerId);
        }
        if (levelTimerId !== undefined) {
            clearInterval(levelTimerId);
        }
        // make sure svg is removed from DOM
        if (currentMapData) {
            currentMapData.element.remove();
        }
    }
    // debugging: test level switch
    // setTimeout(() => gotoLevelN(1), 5000);
    function gotoNextLevel() {
        currentLevelNr++;
        return gotoLevelN(currentLevelNr);
    }
    function gotoLevelN(levelNr) {
        if (stopGameLoop) {
            stopGameLoop();
        }
        unregisterPrevious();
        console.log(`Loading level ${levelNr}`);
        fetch_map_1.loadMap(`maps/level${levelNr}.svg`, "levelMountPoint").then((data) => {
            prepareFeedbackIcons(data);
            // ensure that no further changes are made to the map data
            utils_6.deepFreeze(data);
            // markElementPositions(data);
            resetLevelData();
            // setupLevelTimer(); TODO clarify design for timer/scoring
            currentMapData = data;
            // markPoweredSockets(data);
            for (const s of data.sockets) {
                registerInputHandlers(s, data);
            }
            // now, with everything configured, let's start up the updates
            stopGameLoop = run_game_loop_1.runGameLoop((deltaT, stopGameLoop) => update(deltaT, stopGameLoop, levelNr, data), conf.maxFps);
            console.log("STOP: ", stopGameLoop);
            console.log(`Successfully imported level ${levelNr}: `, data);
        });
    }
    function prepareFeedbackIcons(data) {
        /*
         * Make sure the SVGs are loaded
         */
        const iconsP = iconPrototypes ?
            Promise.resolve(iconPrototypes) :
            Promise.all([shockedSvgP, happySvgP, boredSvgP,])
                .then(([shocked, happy, bored]) => {
                iconPrototypes = { shocked, happy, bored };
                console.log("iconPrototypes", iconPrototypes);
                return iconPrototypes;
            });
        /*
         * make sure we have at least as many dom-elements
         * of each type as we have sockets in the map.
         */
        iconsP.then(iconPrototypes => {
            const prepareIcons = (containerDiv, type) => {
                while (iconElements[type].length < data.sockets.length) {
                    const el = iconPrototypes[type].cloneNode(true);
                    iconElements[type].push(el); // cache reference for later access
                    if (containerDiv) {
                        containerDiv.appendChild(el); // append to dom
                        el.style.display = "none";
                    }
                }
            };
            prepareIcons(pointsDecEl, "shocked");
            prepareIcons(pointsDecEl, "bored");
            prepareIcons(pointsIncEl, "happy");
        });
    }
    function setupLevelTimer() {
        levelTimerId = setInterval(() => {
            timeLevel--;
            if (timeLevel <= 0) {
                // timed out everything gets reset to the start of the level
                brrzzzl();
                resetLevelData();
            }
            if (timeLeftEl && scoreEl && score) {
                timeLeftEl.innerHTML = "Time left: " + Math.max(timeLevel, 0);
                scoreEl.innerHTML = "Score: " + score;
            }
        }, 1000);
    }
    function registerInputHandlers(s, data) {
        console.log("registering input handlers");
        // setupDbgClickHandler(data);
        s.element.addEventListener("click", e => {
            const ptg = is_powered_1.pathToGenerator(s, data);
            console.log("[dbg] is clicked socket powered? ", ptg.size > 0);
            console.log("[dbg] poweredVia: ", ptg);
            for (const pathPiece of ptg) {
                pathPiece.element.style.stroke = conf.shockColor;
                utils_6.delay(900).then(() => {
                    pathPiece.element.style.stroke = conf.defaultColor;
                });
            }
        });
        s.element.addEventListener("mousedown", e => {
            e.preventDefault();
            touchedSockets.add(s);
        }, false);
        s.element.addEventListener("touchstart", e => {
            e.preventDefault();
            touchedSockets.add(s);
        }, false);
        s.element.addEventListener("mouseup", e => {
            touchedSockets.delete(s);
        }, false);
        s.element.addEventListener("touchend", e => {
            touchedSockets.delete(s);
        }, false);
    }
    /**
     * All the game-logic around scoring and GUI-updates
     */
    function update(deltaT, stopGameLoop, levelNr, data) {
        const pathsToGenerator = utils_6.mapToMap(data.sockets, s => {
            const visited = new Set();
            const powered = new Set();
            is_powered_1.pathToGenerator(s, data, visited, powered);
            return { visited, powered };
        });
        const poweredSockets = new Set(data.sockets.filter(s => {
            const ptg = pathsToGenerator.get(s);
            return ptg && ptg.powered.size > 0;
        }));
        const enabled = new Set(data.sockets.filter(s => 
        // sockets that are currently being shocked, are exempt from scoring
        !currentlyShockedPieces.has(s)));
        const enabledTouched = utils_6.filterSet(enabled, s => touchedSockets.has(s));
        const enabledUntouched = utils_6.filterSet(enabled, s => !touchedSockets.has(s));
        const safeButUntouched = utils_6.filterSet(enabledUntouched, s => !poweredSockets.has(s));
        const safeAndTouched = utils_6.filterSet(enabledTouched, s => !poweredSockets.has(s));
        const poweredAndTouched = utils_6.filterSet(enabledTouched, s => poweredSockets.has(s));
        for (const s of safeButUntouched) {
            points -= conf.levels[levelNr].missedOpportunityPenalty * deltaT / 1000;
        }
        for (const s of safeAndTouched) {
            points += conf.levels[levelNr].takenOpportunityPoints * deltaT / 1000;
        }
        for (const s of poweredAndTouched) {
            // vibration not yet started for that socket
            const ptg = pathsToGenerator.get(s);
            if (ptg) {
                for (const pathPiece of ptg.visited) {
                    currentlyShockedPieces.add(pathPiece);
                    utils_6.delay(conf.shockDuration * 1000).then(() => {
                        currentlyShockedPieces.delete(pathPiece);
                    });
                }
            }
            points -= conf.levels[levelNr].shockPenalty;
            brrzzzl(conf.shockDuration * 1000);
        }
        points = Math.max(points, 0);
        points = Math.min(points, 100);
        if (points >= 100) {
            // score += timeLevel; TODO clarify design for timer/scoring
            gotoNextLevel();
        }
        updateFpsCounter(deltaT);
        updateProgressBar(points);
        updateStrokeColors({
            safeAndTouched,
            pathsToGenerator,
            currentlyShockedPieces,
            mapData: data
        });
        updateFeedbackIcons({
            happy: safeAndTouched.size,
            bored: safeButUntouched.size,
            shocked: poweredAndTouched.size,
        });
    }
    function updateStrokeColors(args) {
        const { mapData, safeAndTouched, pathsToGenerator, currentlyShockedPieces, } = args;
        const toStrokeWith = new Map(); // maps to color-string
        for (const s of mapData.sockets) {
            toStrokeWith.set(s, conf.defaultColor);
        }
        for (const g of mapData.generators) {
            toStrokeWith.set(g, conf.defaultColor);
        }
        for (const p of mapData.powerlines) {
            toStrokeWith.set(p, conf.defaultColor);
        }
        for (const s of mapData.switches) {
            toStrokeWith.set(s, conf.defaultColor);
        }
        for (const s of safeAndTouched) {
            const ptg = pathsToGenerator.get(s);
            if (ptg) {
                for (const pathPiece of ptg.visited) {
                    toStrokeWith.set(pathPiece, conf.happyColor);
                }
            }
        }
        for (const piece of currentlyShockedPieces) {
            toStrokeWith.set(piece, conf.shockColor);
        }
        for (const [pathPiece, color] of toStrokeWith) {
            pathPiece.element.style.stroke = color;
        }
    }
    function updateFpsCounter(deltaT) {
        if (deltaT > 0) {
            const fps = 1000 / deltaT;
            if (fpsEl) {
                // the slice is to ensure a fixed string length. need to change this to use non-collapsible spaces.
                fpsEl.innerHTML = "scoring-fps: " + ("____" + fps.toFixed(1)).slice(-4);
            }
        }
    }
    function updateFeedbackIcons(counts) {
        function updateIconType(type) {
            if (iconElements && iconElements[type]) {
                // make counts[type] icons of <type> visible
                for (let i = 0; i < iconElements[type].length; i++) {
                    iconElements[type][i].style.display =
                        (i < counts[type]) ?
                            "block" :
                            "none"; /* invisible */
                }
            }
        }
        updateIconType("shocked");
        updateIconType("bored");
        updateIconType("happy");
    }
    function updateProgressBar(points) {
        const pointsRounded = points.toFixed(1);
        if (progressEl) {
            progressEl.innerHTML = pointsRounded + "%";
            progressEl.style.width = pointsRounded + "%";
            if (points > 20 && points < 50) {
                progressEl.classList.remove("progress-bar-danger");
                progressEl.classList.add("progress-bar-warning");
            }
            else if (points > 50) {
                progressEl.classList.remove("progress-bar-warning");
                progressEl.classList.add("progress-bar-success");
            }
            else {
            }
        }
    }
    /**
    * https://www.sitepoint.com/use-html5-vibration-api/
    * https://davidwalsh.name/vibration-api
    */
    function brrzzzl(durationInMs = 900) {
        // TODO visual effect for same duration
        if ("vibrate" in navigator) {
            // vibration API supported
            navigator.vibrate([
                durationInMs * 5 / 9,
                durationInMs * 3 / 9,
                durationInMs * 1 / 9,
            ]);
            console.log("I am vibrating!!");
        }
    }
    exports_8("brrzzzl", brrzzzl);
    /**
     * Function for debugging the coordinate
     * system tranformation. Marks the origin of
     * all svg-elements and all path-ends in the
     * map with a circle.
     */
    function markElementPositions(mapData) {
        for (const s of mapData.sockets) {
            utils_6.markCoords(mapData.element, s.pos.x, s.pos.y);
        }
        for (const g of mapData.generators) {
            utils_6.markCoords(mapData.element, g.pos.x, g.pos.y);
        }
        for (const p of mapData.powerlines) {
            utils_6.markCoords(mapData.element, p.start.x, p.start.y);
            utils_6.markCoords(mapData.element, p.end.x, p.end.y);
        }
    }
    /**
     * Function to visualise the sockets
     * that are powered (for debug-purposes)
     */
    function markPoweredSockets(mapData) {
        for (const s of mapData.sockets) {
            // mark powered sockets
            const unregister = utils_6.markCoordsLive(mapData.element, s.pos.x, s.pos.y, () => is_powered_1.isPowered(s, mapData));
            unregisterDebugMarker.push(unregister);
        }
    }
    function unregisterDebugMarkers() {
        let unregister;
        while (unregister = unregisterDebugMarker.pop()) {
            if (unregister && utils_6.hasJSType("Function", unregister)) {
                console.log("Unregistering debug mark");
                unregister();
            }
        }
    }
    function setupDbgClickHandler(data) {
        data.element.addEventListener("click", e => {
            const dom2vbox = utils_6.makeDOM2VBox(data.element);
            const elements = svg_elements_at_2.svgElementsAt(dom2vbox({ x: e.clientX, y: e.clientY }), data.element);
            const pieces = geometry_2.piecesAt(data, dom2vbox({ x: e.clientX, y: e.clientY }));
            console.log("clicked on the following: ", elements, pieces);
        });
    }
    return {
        setters:[
            function (_2) {},
            function (geometry_2_1) {
                geometry_2 = geometry_2_1;
            },
            function (is_powered_1_1) {
                is_powered_1 = is_powered_1_1;
            },
            function (fetch_map_1_1) {
                fetch_map_1 = fetch_map_1_1;
            },
            function (run_game_loop_1_1) {
                run_game_loop_1 = run_game_loop_1_1;
            },
            function (svg_elements_at_2_1) {
                svg_elements_at_2 = svg_elements_at_2_1;
            },
            function (utils_6_1) {
                utils_6 = utils_6_1;
            },
            function (conf_1) {
                conf = conf_1;
            }],
        execute: function() {
            /**
             * GLOBAL STATE :|
             */
            scoreEl = document.getElementById("score");
            score = 0;
             ///points, adding according to how long someone is pressing the right socket
            // let stopGameLoop: () => void;
            timeLeftEl = document.getElementById("timeLeft");
            fpsEl = document.getElementById("fps");
            progressEl = document.getElementById("progress");
            pointsIncEl = document.getElementById("pointIncIcons");
            pointsDecEl = document.getElementById("pointDecIcons");
            unregisterDebugMarker = [];
            touchedSockets = new Set();
            currentLevelNr = 0; // increase to start at higher level
             // shocked, happy, bored
            iconElements = {
                shocked: [],
                happy: [],
                bored: [],
            };
            currentlyShockedPieces = new Set();
            /*
             * ensure that the icons are loaded
             */
            shockedSvgP = fetch_map_1.fetchSvg("icons/shocked.svg");
            happySvgP = fetch_map_1.fetchSvg("icons/happy_face.svg");
            boredSvgP = fetch_map_1.fetchSvg("icons/bored_face.svg");
            /*
             * establish default values
             */
            resetLevelData();
            // To enable automatic sub-pixel offset correction when the window is resized:
            // SVG.on(window, 'resize', function() { draw.spof() })
            /*
             * START GAME
             */
            gotoLevelN(currentLevelNr);
        }
    }
});
System.register("test-import", [], function(exports_9, context_9) {
    "use strict";
    var __moduleName = context_9 && context_9.id;
    var foo;
    return {
        setters:[],
        execute: function() {
            exports_9("foo", foo = 123);
        }
    }
});

//# sourceMappingURL=bundle.js.map
