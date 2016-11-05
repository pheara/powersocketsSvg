/*declare module "svg-path-parser" {
  let _temp: any;
  export = _temp;
}*/

declare module "svg-path-parser";

interface Rectangle {
  pos: Point, // left-upper corner
  width: number,
  height: number,
  element: SVGRectElement
}
interface Powerline {
  start: Point
  end: Point
  element: SVGPathElement
}
interface Point {
  x: number,
  y: number,
}
