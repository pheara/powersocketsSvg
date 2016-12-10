declare module "svg-points";

interface MapData {
  element: SVGSVGElement,
  generators: Generator[],
  sockets: Socket[],
  switches: Switch[],
  powerlines: Powerline[],
}

interface Switch {
  element: SVGPathElement;
}

interface Rectangle {
  pos: Point; // left-upper corner
  width: number;
  height: number;
  element: SVGRectElement;
}

interface Generator extends Rectangle {}
interface Socket extends Rectangle {}

interface Powerline {
  start: Point;
  end: Point;
  element: SVGPathElement;
}
interface Point {
  x: number;
  y: number;
}
