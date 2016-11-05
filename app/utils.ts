export function valueOr<T>(value: T | undefined | null, deflt: T): T {
  return value? value : deflt;
}

export function hasJSType(obj: any) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}
