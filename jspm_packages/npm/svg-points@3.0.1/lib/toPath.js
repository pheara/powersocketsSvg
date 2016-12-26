/* */ 
'use strict';
exports.__esModule = true;
var _toPoints = require('./toPoints');
var _toPoints2 = _interopRequireDefault(_toPoints);
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}
var pointsToD = function(p) {
  var d = '';
  var i = 0;
  var firstPoint = p[i];
  for (var _iterator = p,
      _isArray = Array.isArray(_iterator),
      _i = 0,
      _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ; ) {
    var _ref;
    if (_isArray) {
      if (_i >= _iterator.length)
        break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done)
        break;
      _ref = _i.value;
    }
    var point = _ref;
    var isFirstPoint = i === 0;
    var isLastPoint = i === p.length - 1;
    var prevPoint = isFirstPoint ? null : p[i - 1];
    var _point$curve = point.curve;
    var curve = _point$curve === undefined ? false : _point$curve;
    var moveTo = point.moveTo;
    var x = point.x;
    var y = point.y;
    if (moveTo || isFirstPoint) {
      if (!isLastPoint) {
        d += 'M' + x + ',' + y;
      }
    } else if (curve) {
      switch (curve.type) {
        case 'arc':
          var _point$curve2 = point.curve;
          var _point$curve2$largeAr = _point$curve2.largeArcFlag;
          var largeArcFlag = _point$curve2$largeAr === undefined ? 0 : _point$curve2$largeAr;
          var rx = _point$curve2.rx;
          var ry = _point$curve2.ry;
          var _point$curve2$sweepFl = _point$curve2.sweepFlag;
          var sweepFlag = _point$curve2$sweepFl === undefined ? 0 : _point$curve2$sweepFl;
          var _point$curve2$xAxisRo = _point$curve2.xAxisRotation;
          var xAxisRotation = _point$curve2$xAxisRo === undefined ? 0 : _point$curve2$xAxisRo;
          d += 'A' + rx + ',' + ry + ',' + xAxisRotation + ',' + largeArcFlag + ',' + sweepFlag + ',' + x + ',' + y;
          break;
        case 'cubic':
          var _point$curve3 = point.curve;
          var cx1 = _point$curve3.x1;
          var cy1 = _point$curve3.y1;
          var cx2 = _point$curve3.x2;
          var cy2 = _point$curve3.y2;
          d += 'C' + cx1 + ',' + cy1 + ',' + cx2 + ',' + cy2 + ',' + x + ',' + y;
          break;
        case 'quadratic':
          var _point$curve4 = point.curve;
          var qx1 = _point$curve4.x1;
          var qy1 = _point$curve4.y1;
          d += 'Q' + qx1 + ',' + qy1 + ',' + x + ',' + y;
          break;
      }
      if (isLastPoint && x === firstPoint.x && y === firstPoint.y) {
        d += 'Z';
      }
    } else if (isLastPoint && x === firstPoint.x && y === firstPoint.y) {
      d += 'Z';
    } else if (x !== prevPoint.x && y !== prevPoint.y) {
      d += 'L' + x + ',' + y;
    } else if (x !== prevPoint.x) {
      d += 'H' + x;
    } else if (y !== prevPoint.y) {
      d += 'V' + y;
    }
    i++;
  }
  return d;
};
var toPath = function(s) {
  var isPoints = Array.isArray(s);
  var isGroup = isPoints ? Array.isArray(s[0]) : s.type === 'g';
  var points = isPoints ? s : isGroup ? s.shapes.map(function(shp) {
    return (0, _toPoints2.default)(shp);
  }) : (0, _toPoints2.default)(s);
  if (isGroup) {
    return points.map(function(p) {
      return pointsToD(p);
    });
  }
  return pointsToD(points);
};
exports.default = toPath;
