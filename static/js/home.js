(function() {
  "use strict";
  var defaultInstanceSettings = {
    update: null,
    begin: null,
    loopBegin: null,
    changeBegin: null,
    change: null,
    changeComplete: null,
    loopComplete: null,
    complete: null,
    loop: 1,
    direction: "normal",
    autoplay: true,
    timelineOffset: 0
  };
  var defaultTweenSettings = {
    duration: 1e3,
    delay: 0,
    endDelay: 0,
    easing: "easeOutElastic(1, .5)",
    round: 0
  };
  var validTransforms = ["translateX", "translateY", "translateZ", "rotate", "rotateX", "rotateY", "rotateZ", "scale", "scaleX", "scaleY", "scaleZ", "skew", "skewX", "skewY", "perspective", "matrix", "matrix3d"];
  var cache = {
    CSS: {},
    springs: {}
  };
  function minMax(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
  function stringContains(str, text) {
    return str.indexOf(text) > -1;
  }
  function applyArguments(func, args) {
    return func.apply(null, args);
  }
  var is = {
    arr: function(a) {
      return Array.isArray(a);
    },
    obj: function(a) {
      return stringContains(Object.prototype.toString.call(a), "Object");
    },
    pth: function(a) {
      return is.obj(a) && a.hasOwnProperty("totalLength");
    },
    svg: function(a) {
      return a instanceof SVGElement;
    },
    inp: function(a) {
      return a instanceof HTMLInputElement;
    },
    dom: function(a) {
      return a.nodeType || is.svg(a);
    },
    str: function(a) {
      return typeof a === "string";
    },
    fnc: function(a) {
      return typeof a === "function";
    },
    und: function(a) {
      return typeof a === "undefined";
    },
    nil: function(a) {
      return is.und(a) || a === null;
    },
    hex: function(a) {
      return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a);
    },
    rgb: function(a) {
      return /^rgb/.test(a);
    },
    hsl: function(a) {
      return /^hsl/.test(a);
    },
    col: function(a) {
      return is.hex(a) || is.rgb(a) || is.hsl(a);
    },
    key: function(a) {
      return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== "targets" && a !== "keyframes";
    }
  };
  function parseEasingParameters(string) {
    var match = /\(([^)]+)\)/.exec(string);
    return match ? match[1].split(",").map(function(p) {
      return parseFloat(p);
    }) : [];
  }
  function spring(string, duration) {
    var params = parseEasingParameters(string);
    var mass = minMax(is.und(params[0]) ? 1 : params[0], 0.1, 100);
    var stiffness = minMax(is.und(params[1]) ? 100 : params[1], 0.1, 100);
    var damping = minMax(is.und(params[2]) ? 10 : params[2], 0.1, 100);
    var velocity = minMax(is.und(params[3]) ? 0 : params[3], 0.1, 100);
    var w0 = Math.sqrt(stiffness / mass);
    var zeta = damping / (2 * Math.sqrt(stiffness * mass));
    var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
    var a = 1;
    var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;
    function solver(t) {
      var progress = duration ? duration * t / 1e3 : t;
      if (zeta < 1) {
        progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
      } else {
        progress = (a + b * progress) * Math.exp(-progress * w0);
      }
      if (t === 0 || t === 1) {
        return t;
      }
      return 1 - progress;
    }
    function getDuration() {
      var cached = cache.springs[string];
      if (cached) {
        return cached;
      }
      var frame = 1 / 6;
      var elapsed = 0;
      var rest = 0;
      while (true) {
        elapsed += frame;
        if (solver(elapsed) === 1) {
          rest++;
          if (rest >= 16) {
            break;
          }
        } else {
          rest = 0;
        }
      }
      var duration2 = elapsed * frame * 1e3;
      cache.springs[string] = duration2;
      return duration2;
    }
    return duration ? solver : getDuration;
  }
  function steps(steps2) {
    if (steps2 === void 0)
      steps2 = 10;
    return function(t) {
      return Math.ceil(minMax(t, 1e-6, 1) * steps2) * (1 / steps2);
    };
  }
  var bezier = function() {
    var kSplineTableSize = 11;
    var kSampleStepSize = 1 / (kSplineTableSize - 1);
    function A(aA1, aA2) {
      return 1 - 3 * aA2 + 3 * aA1;
    }
    function B(aA1, aA2) {
      return 3 * aA2 - 6 * aA1;
    }
    function C(aA1) {
      return 3 * aA1;
    }
    function calcBezier(aT, aA1, aA2) {
      return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    }
    function getSlope(aT, aA1, aA2) {
      return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1);
    }
    function binarySubdivide(aX, aA, aB, mX1, mX2) {
      var currentX, currentT, i = 0;
      do {
        currentT = aA + (aB - aA) / 2;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
      } while (Math.abs(currentX) > 1e-7 && ++i < 10);
      return currentT;
    }
    function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
      for (var i = 0; i < 4; ++i) {
        var currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0) {
          return aGuessT;
        }
        var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    }
    function bezier2(mX1, mY1, mX2, mY2) {
      if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        return;
      }
      var sampleValues = new Float32Array(kSplineTableSize);
      if (mX1 !== mY1 || mX2 !== mY2) {
        for (var i = 0; i < kSplineTableSize; ++i) {
          sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
      }
      function getTForX(aX) {
        var intervalStart = 0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;
        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }
        --currentSample;
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;
        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= 1e-3) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
      }
      return function(x) {
        if (mX1 === mY1 && mX2 === mY2) {
          return x;
        }
        if (x === 0 || x === 1) {
          return x;
        }
        return calcBezier(getTForX(x), mY1, mY2);
      };
    }
    return bezier2;
  }();
  var penner = function() {
    var eases = { linear: function() {
      return function(t) {
        return t;
      };
    } };
    var functionEasings = {
      Sine: function() {
        return function(t) {
          return 1 - Math.cos(t * Math.PI / 2);
        };
      },
      Circ: function() {
        return function(t) {
          return 1 - Math.sqrt(1 - t * t);
        };
      },
      Back: function() {
        return function(t) {
          return t * t * (3 * t - 2);
        };
      },
      Bounce: function() {
        return function(t) {
          var pow2, b = 4;
          while (t < ((pow2 = Math.pow(2, --b)) - 1) / 11) {
          }
          return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2);
        };
      },
      Elastic: function(amplitude, period) {
        if (amplitude === void 0)
          amplitude = 1;
        if (period === void 0)
          period = 0.5;
        var a = minMax(amplitude, 1, 10);
        var p = minMax(period, 0.1, 2);
        return function(t) {
          return t === 0 || t === 1 ? t : -a * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - p / (Math.PI * 2) * Math.asin(1 / a)) * (Math.PI * 2) / p);
        };
      }
    };
    var baseEasings = ["Quad", "Cubic", "Quart", "Quint", "Expo"];
    baseEasings.forEach(function(name, i) {
      functionEasings[name] = function() {
        return function(t) {
          return Math.pow(t, i + 2);
        };
      };
    });
    Object.keys(functionEasings).forEach(function(name) {
      var easeIn = functionEasings[name];
      eases["easeIn" + name] = easeIn;
      eases["easeOut" + name] = function(a, b) {
        return function(t) {
          return 1 - easeIn(a, b)(1 - t);
        };
      };
      eases["easeInOut" + name] = function(a, b) {
        return function(t) {
          return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 1 - easeIn(a, b)(t * -2 + 2) / 2;
        };
      };
      eases["easeOutIn" + name] = function(a, b) {
        return function(t) {
          return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : (easeIn(a, b)(t * 2 - 1) + 1) / 2;
        };
      };
    });
    return eases;
  }();
  function parseEasings(easing, duration) {
    if (is.fnc(easing)) {
      return easing;
    }
    var name = easing.split("(")[0];
    var ease = penner[name];
    var args = parseEasingParameters(easing);
    switch (name) {
      case "spring":
        return spring(easing, duration);
      case "cubicBezier":
        return applyArguments(bezier, args);
      case "steps":
        return applyArguments(steps, args);
      default:
        return applyArguments(ease, args);
    }
  }
  function selectString(str) {
    try {
      var nodes = document.querySelectorAll(str);
      return nodes;
    } catch (e) {
      return;
    }
  }
  function filterArray(arr, callback) {
    var len = arr.length;
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    var result = [];
    for (var i = 0; i < len; i++) {
      if (i in arr) {
        var val = arr[i];
        if (callback.call(thisArg, val, i, arr)) {
          result.push(val);
        }
      }
    }
    return result;
  }
  function flattenArray(arr) {
    return arr.reduce(function(a, b) {
      return a.concat(is.arr(b) ? flattenArray(b) : b);
    }, []);
  }
  function toArray(o) {
    if (is.arr(o)) {
      return o;
    }
    if (is.str(o)) {
      o = selectString(o) || o;
    }
    if (o instanceof NodeList || o instanceof HTMLCollection) {
      return [].slice.call(o);
    }
    return [o];
  }
  function arrayContains(arr, val) {
    return arr.some(function(a) {
      return a === val;
    });
  }
  function cloneObject(o) {
    var clone = {};
    for (var p in o) {
      clone[p] = o[p];
    }
    return clone;
  }
  function replaceObjectProps(o1, o2) {
    var o = cloneObject(o1);
    for (var p in o1) {
      o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p];
    }
    return o;
  }
  function mergeObjects(o1, o2) {
    var o = cloneObject(o1);
    for (var p in o2) {
      o[p] = is.und(o1[p]) ? o2[p] : o1[p];
    }
    return o;
  }
  function rgbToRgba(rgbValue) {
    var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
    return rgb ? "rgba(" + rgb[1] + ",1)" : rgbValue;
  }
  function hexToRgba(hexValue) {
    var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    var hex = hexValue.replace(rgx, function(m, r2, g2, b2) {
      return r2 + r2 + g2 + g2 + b2 + b2;
    });
    var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var r = parseInt(rgb[1], 16);
    var g = parseInt(rgb[2], 16);
    var b = parseInt(rgb[3], 16);
    return "rgba(" + r + "," + g + "," + b + ",1)";
  }
  function hslToRgba(hslValue) {
    var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
    var h = parseInt(hsl[1], 10) / 360;
    var s = parseInt(hsl[2], 10) / 100;
    var l = parseInt(hsl[3], 10) / 100;
    var a = hsl[4] || 1;
    function hue2rgb(p2, q2, t) {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p2 + (q2 - p2) * 6 * t;
      }
      if (t < 1 / 2) {
        return q2;
      }
      if (t < 2 / 3) {
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      }
      return p2;
    }
    var r, g, b;
    if (s == 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return "rgba(" + r * 255 + "," + g * 255 + "," + b * 255 + "," + a + ")";
  }
  function colorToRgb(val) {
    if (is.rgb(val)) {
      return rgbToRgba(val);
    }
    if (is.hex(val)) {
      return hexToRgba(val);
    }
    if (is.hsl(val)) {
      return hslToRgba(val);
    }
  }
  function getUnit(val) {
    var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
    if (split) {
      return split[1];
    }
  }
  function getTransformUnit(propName) {
    if (stringContains(propName, "translate") || propName === "perspective") {
      return "px";
    }
    if (stringContains(propName, "rotate") || stringContains(propName, "skew")) {
      return "deg";
    }
  }
  function getFunctionValue(val, animatable) {
    if (!is.fnc(val)) {
      return val;
    }
    return val(animatable.target, animatable.id, animatable.total);
  }
  function getAttribute(el, prop) {
    return el.getAttribute(prop);
  }
  function convertPxToUnit(el, value, unit) {
    var valueUnit = getUnit(value);
    if (arrayContains([unit, "deg", "rad", "turn"], valueUnit)) {
      return value;
    }
    var cached = cache.CSS[value + unit];
    if (!is.und(cached)) {
      return cached;
    }
    var baseline = 100;
    var tempEl = document.createElement(el.tagName);
    var parentEl = el.parentNode && el.parentNode !== document ? el.parentNode : document.body;
    parentEl.appendChild(tempEl);
    tempEl.style.position = "absolute";
    tempEl.style.width = baseline + unit;
    var factor = baseline / tempEl.offsetWidth;
    parentEl.removeChild(tempEl);
    var convertedUnit = factor * parseFloat(value);
    cache.CSS[value + unit] = convertedUnit;
    return convertedUnit;
  }
  function getCSSValue(el, prop, unit) {
    if (prop in el.style) {
      var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || "0";
      return unit ? convertPxToUnit(el, value, unit) : value;
    }
  }
  function getAnimationType(el, prop) {
    if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || is.svg(el) && el[prop])) {
      return "attribute";
    }
    if (is.dom(el) && arrayContains(validTransforms, prop)) {
      return "transform";
    }
    if (is.dom(el) && (prop !== "transform" && getCSSValue(el, prop))) {
      return "css";
    }
    if (el[prop] != null) {
      return "object";
    }
  }
  function getElementTransforms(el) {
    if (!is.dom(el)) {
      return;
    }
    var str = el.style.transform || "";
    var reg = /(\w+)\(([^)]*)\)/g;
    var transforms = /* @__PURE__ */ new Map();
    var m;
    while (m = reg.exec(str)) {
      transforms.set(m[1], m[2]);
    }
    return transforms;
  }
  function getTransformValue(el, propName, animatable, unit) {
    var defaultVal = stringContains(propName, "scale") ? 1 : 0 + getTransformUnit(propName);
    var value = getElementTransforms(el).get(propName) || defaultVal;
    if (animatable) {
      animatable.transforms.list.set(propName, value);
      animatable.transforms["last"] = propName;
    }
    return unit ? convertPxToUnit(el, value, unit) : value;
  }
  function getOriginalTargetValue(target, propName, unit, animatable) {
    switch (getAnimationType(target, propName)) {
      case "transform":
        return getTransformValue(target, propName, animatable, unit);
      case "css":
        return getCSSValue(target, propName, unit);
      case "attribute":
        return getAttribute(target, propName);
      default:
        return target[propName] || 0;
    }
  }
  function getRelativeValue(to, from) {
    var operator = /^(\*=|\+=|-=)/.exec(to);
    if (!operator) {
      return to;
    }
    var u = getUnit(to) || 0;
    var x = parseFloat(from);
    var y = parseFloat(to.replace(operator[0], ""));
    switch (operator[0][0]) {
      case "+":
        return x + y + u;
      case "-":
        return x - y + u;
      case "*":
        return x * y + u;
    }
  }
  function validateValue(val, unit) {
    if (is.col(val)) {
      return colorToRgb(val);
    }
    if (/\s/g.test(val)) {
      return val;
    }
    var originalUnit = getUnit(val);
    var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
    if (unit) {
      return unitLess + unit;
    }
    return unitLess;
  }
  function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  function getCircleLength(el) {
    return Math.PI * 2 * getAttribute(el, "r");
  }
  function getRectLength(el) {
    return getAttribute(el, "width") * 2 + getAttribute(el, "height") * 2;
  }
  function getLineLength(el) {
    return getDistance(
      { x: getAttribute(el, "x1"), y: getAttribute(el, "y1") },
      { x: getAttribute(el, "x2"), y: getAttribute(el, "y2") }
    );
  }
  function getPolylineLength(el) {
    var points = el.points;
    var totalLength = 0;
    var previousPos;
    for (var i = 0; i < points.numberOfItems; i++) {
      var currentPos = points.getItem(i);
      if (i > 0) {
        totalLength += getDistance(previousPos, currentPos);
      }
      previousPos = currentPos;
    }
    return totalLength;
  }
  function getPolygonLength(el) {
    var points = el.points;
    return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
  }
  function getTotalLength(el) {
    if (el.getTotalLength) {
      return el.getTotalLength();
    }
    switch (el.tagName.toLowerCase()) {
      case "circle":
        return getCircleLength(el);
      case "rect":
        return getRectLength(el);
      case "line":
        return getLineLength(el);
      case "polyline":
        return getPolylineLength(el);
      case "polygon":
        return getPolygonLength(el);
    }
  }
  function setDashoffset(el) {
    var pathLength = getTotalLength(el);
    el.setAttribute("stroke-dasharray", pathLength);
    return pathLength;
  }
  function getParentSvgEl(el) {
    var parentEl = el.parentNode;
    while (is.svg(parentEl)) {
      if (!is.svg(parentEl.parentNode)) {
        break;
      }
      parentEl = parentEl.parentNode;
    }
    return parentEl;
  }
  function getParentSvg(pathEl, svgData) {
    var svg = svgData || {};
    var parentSvgEl = svg.el || getParentSvgEl(pathEl);
    var rect = parentSvgEl.getBoundingClientRect();
    var viewBoxAttr = getAttribute(parentSvgEl, "viewBox");
    var width = rect.width;
    var height = rect.height;
    var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(" ") : [0, 0, width, height]);
    return {
      el: parentSvgEl,
      viewBox,
      x: viewBox[0] / 1,
      y: viewBox[1] / 1,
      w: width,
      h: height,
      vW: viewBox[2],
      vH: viewBox[3]
    };
  }
  function getPath(path, percent) {
    var pathEl = is.str(path) ? selectString(path)[0] : path;
    var p = percent || 100;
    return function(property) {
      return {
        property,
        el: pathEl,
        svg: getParentSvg(pathEl),
        totalLength: getTotalLength(pathEl) * (p / 100)
      };
    };
  }
  function getPathProgress(path, progress, isPathTargetInsideSVG) {
    function point(offset) {
      if (offset === void 0)
        offset = 0;
      var l = progress + offset >= 1 ? progress + offset : 0;
      return path.el.getPointAtLength(l);
    }
    var svg = getParentSvg(path.el, path.svg);
    var p = point();
    var p0 = point(-1);
    var p1 = point(1);
    var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
    var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
    switch (path.property) {
      case "x":
        return (p.x - svg.x) * scaleX;
      case "y":
        return (p.y - svg.y) * scaleY;
      case "angle":
        return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
    }
  }
  function decomposeValue(val, unit) {
    var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    var value = validateValue(is.pth(val) ? val.totalLength : val, unit) + "";
    return {
      original: value,
      numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
      strings: is.str(val) || unit ? value.split(rgx) : []
    };
  }
  function parseTargets(targets) {
    var targetsArray = targets ? flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets)) : [];
    return filterArray(targetsArray, function(item, pos, self2) {
      return self2.indexOf(item) === pos;
    });
  }
  function getAnimatables(targets) {
    var parsed = parseTargets(targets);
    return parsed.map(function(t, i) {
      return { target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
    });
  }
  function normalizePropertyTweens(prop, tweenSettings) {
    var settings = cloneObject(tweenSettings);
    if (/^spring/.test(settings.easing)) {
      settings.duration = spring(settings.easing);
    }
    if (is.arr(prop)) {
      var l = prop.length;
      var isFromTo = l === 2 && !is.obj(prop[0]);
      if (!isFromTo) {
        if (!is.fnc(tweenSettings.duration)) {
          settings.duration = tweenSettings.duration / l;
        }
      } else {
        prop = { value: prop };
      }
    }
    var propArray = is.arr(prop) ? prop : [prop];
    return propArray.map(function(v, i) {
      var obj = is.obj(v) && !is.pth(v) ? v : { value: v };
      if (is.und(obj.delay)) {
        obj.delay = !i ? tweenSettings.delay : 0;
      }
      if (is.und(obj.endDelay)) {
        obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0;
      }
      return obj;
    }).map(function(k) {
      return mergeObjects(k, settings);
    });
  }
  function flattenKeyframes(keyframes) {
    var propertyNames = filterArray(flattenArray(keyframes.map(function(key) {
      return Object.keys(key);
    })), function(p) {
      return is.key(p);
    }).reduce(function(a, b) {
      if (a.indexOf(b) < 0) {
        a.push(b);
      }
      return a;
    }, []);
    var properties = {};
    var loop = function(i2) {
      var propName = propertyNames[i2];
      properties[propName] = keyframes.map(function(key) {
        var newKey = {};
        for (var p in key) {
          if (is.key(p)) {
            if (p == propName) {
              newKey.value = key[p];
            }
          } else {
            newKey[p] = key[p];
          }
        }
        return newKey;
      });
    };
    for (var i = 0; i < propertyNames.length; i++)
      loop(i);
    return properties;
  }
  function getProperties(tweenSettings, params) {
    var properties = [];
    var keyframes = params.keyframes;
    if (keyframes) {
      params = mergeObjects(flattenKeyframes(keyframes), params);
    }
    for (var p in params) {
      if (is.key(p)) {
        properties.push({
          name: p,
          tweens: normalizePropertyTweens(params[p], tweenSettings)
        });
      }
    }
    return properties;
  }
  function normalizeTweenValues(tween, animatable) {
    var t = {};
    for (var p in tween) {
      var value = getFunctionValue(tween[p], animatable);
      if (is.arr(value)) {
        value = value.map(function(v) {
          return getFunctionValue(v, animatable);
        });
        if (value.length === 1) {
          value = value[0];
        }
      }
      t[p] = value;
    }
    t.duration = parseFloat(t.duration);
    t.delay = parseFloat(t.delay);
    return t;
  }
  function normalizeTweens(prop, animatable) {
    var previousTween;
    return prop.tweens.map(function(t) {
      var tween = normalizeTweenValues(t, animatable);
      var tweenValue = tween.value;
      var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
      var toUnit = getUnit(to);
      var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
      var previousValue = previousTween ? previousTween.to.original : originalValue;
      var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
      var fromUnit = getUnit(from) || getUnit(originalValue);
      var unit = toUnit || fromUnit;
      if (is.und(to)) {
        to = previousValue;
      }
      tween.from = decomposeValue(from, unit);
      tween.to = decomposeValue(getRelativeValue(to, from), unit);
      tween.start = previousTween ? previousTween.end : 0;
      tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
      tween.easing = parseEasings(tween.easing, tween.duration);
      tween.isPath = is.pth(tweenValue);
      tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
      tween.isColor = is.col(tween.from.original);
      if (tween.isColor) {
        tween.round = 1;
      }
      previousTween = tween;
      return tween;
    });
  }
  var setProgressValue = {
    css: function(t, p, v) {
      return t.style[p] = v;
    },
    attribute: function(t, p, v) {
      return t.setAttribute(p, v);
    },
    object: function(t, p, v) {
      return t[p] = v;
    },
    transform: function(t, p, v, transforms, manual) {
      transforms.list.set(p, v);
      if (p === transforms.last || manual) {
        var str = "";
        transforms.list.forEach(function(value, prop) {
          str += prop + "(" + value + ") ";
        });
        t.style.transform = str;
      }
    }
  };
  function setTargetsValue(targets, properties) {
    var animatables = getAnimatables(targets);
    animatables.forEach(function(animatable) {
      for (var property in properties) {
        var value = getFunctionValue(properties[property], animatable);
        var target = animatable.target;
        var valueUnit = getUnit(value);
        var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
        var unit = valueUnit || getUnit(originalValue);
        var to = getRelativeValue(validateValue(value, unit), originalValue);
        var animType = getAnimationType(target, property);
        setProgressValue[animType](target, property, to, animatable.transforms, true);
      }
    });
  }
  function createAnimation(animatable, prop) {
    var animType = getAnimationType(animatable.target, prop.name);
    if (animType) {
      var tweens = normalizeTweens(prop, animatable);
      var lastTween = tweens[tweens.length - 1];
      return {
        type: animType,
        property: prop.name,
        animatable,
        tweens,
        duration: lastTween.end,
        delay: tweens[0].delay,
        endDelay: lastTween.endDelay
      };
    }
  }
  function getAnimations(animatables, properties) {
    return filterArray(flattenArray(animatables.map(function(animatable) {
      return properties.map(function(prop) {
        return createAnimation(animatable, prop);
      });
    })), function(a) {
      return !is.und(a);
    });
  }
  function getInstanceTimings(animations, tweenSettings) {
    var animLength = animations.length;
    var getTlOffset = function(anim) {
      return anim.timelineOffset ? anim.timelineOffset : 0;
    };
    var timings = {};
    timings.duration = animLength ? Math.max.apply(Math, animations.map(function(anim) {
      return getTlOffset(anim) + anim.duration;
    })) : tweenSettings.duration;
    timings.delay = animLength ? Math.min.apply(Math, animations.map(function(anim) {
      return getTlOffset(anim) + anim.delay;
    })) : tweenSettings.delay;
    timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function(anim) {
      return getTlOffset(anim) + anim.duration - anim.endDelay;
    })) : tweenSettings.endDelay;
    return timings;
  }
  var instanceID = 0;
  function createNewInstance(params) {
    var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
    var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
    var properties = getProperties(tweenSettings, params);
    var animatables = getAnimatables(params.targets);
    var animations = getAnimations(animatables, properties);
    var timings = getInstanceTimings(animations, tweenSettings);
    var id = instanceID;
    instanceID++;
    return mergeObjects(instanceSettings, {
      id,
      children: [],
      animatables,
      animations,
      duration: timings.duration,
      delay: timings.delay,
      endDelay: timings.endDelay
    });
  }
  var activeInstances = [];
  var engine = function() {
    var raf;
    function play() {
      if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
        raf = requestAnimationFrame(step);
      }
    }
    function step(t) {
      var activeInstancesLength = activeInstances.length;
      var i = 0;
      while (i < activeInstancesLength) {
        var activeInstance = activeInstances[i];
        if (!activeInstance.paused) {
          activeInstance.tick(t);
          i++;
        } else {
          activeInstances.splice(i, 1);
          activeInstancesLength--;
        }
      }
      raf = i > 0 ? requestAnimationFrame(step) : void 0;
    }
    function handleVisibilityChange() {
      if (!anime.suspendWhenDocumentHidden) {
        return;
      }
      if (isDocumentHidden()) {
        raf = cancelAnimationFrame(raf);
      } else {
        activeInstances.forEach(
          function(instance) {
            return instance._onDocumentVisibility();
          }
        );
        engine();
      }
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return play;
  }();
  function isDocumentHidden() {
    return !!document && document.hidden;
  }
  function anime(params) {
    if (params === void 0)
      params = {};
    var startTime = 0, lastTime = 0, now = 0;
    var children, childrenLength = 0;
    var resolve = null;
    function makePromise(instance2) {
      var promise = window.Promise && new Promise(function(_resolve) {
        return resolve = _resolve;
      });
      instance2.finished = promise;
      return promise;
    }
    var instance = createNewInstance(params);
    makePromise(instance);
    function toggleInstanceDirection() {
      var direction = instance.direction;
      if (direction !== "alternate") {
        instance.direction = direction !== "normal" ? "normal" : "reverse";
      }
      instance.reversed = !instance.reversed;
      children.forEach(function(child) {
        return child.reversed = instance.reversed;
      });
    }
    function adjustTime(time) {
      return instance.reversed ? instance.duration - time : time;
    }
    function resetTime() {
      startTime = 0;
      lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
    }
    function seekChild(time, child) {
      if (child) {
        child.seek(time - child.timelineOffset);
      }
    }
    function syncInstanceChildren(time) {
      if (!instance.reversePlayback) {
        for (var i = 0; i < childrenLength; i++) {
          seekChild(time, children[i]);
        }
      } else {
        for (var i$1 = childrenLength; i$1--; ) {
          seekChild(time, children[i$1]);
        }
      }
    }
    function setAnimationsProgress(insTime) {
      var i = 0;
      var animations = instance.animations;
      var animationsLength = animations.length;
      while (i < animationsLength) {
        var anim = animations[i];
        var animatable = anim.animatable;
        var tweens = anim.tweens;
        var tweenLength = tweens.length - 1;
        var tween = tweens[tweenLength];
        if (tweenLength) {
          tween = filterArray(tweens, function(t) {
            return insTime < t.end;
          })[0] || tween;
        }
        var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
        var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
        var strings = tween.to.strings;
        var round = tween.round;
        var numbers = [];
        var toNumbersLength = tween.to.numbers.length;
        var progress = void 0;
        for (var n = 0; n < toNumbersLength; n++) {
          var value = void 0;
          var toNumber = tween.to.numbers[n];
          var fromNumber = tween.from.numbers[n] || 0;
          if (!tween.isPath) {
            value = fromNumber + eased * (toNumber - fromNumber);
          } else {
            value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
          }
          if (round) {
            if (!(tween.isColor && n > 2)) {
              value = Math.round(value * round) / round;
            }
          }
          numbers.push(value);
        }
        var stringsLength = strings.length;
        if (!stringsLength) {
          progress = numbers[0];
        } else {
          progress = strings[0];
          for (var s = 0; s < stringsLength; s++) {
            strings[s];
            var b = strings[s + 1];
            var n$1 = numbers[s];
            if (!isNaN(n$1)) {
              if (!b) {
                progress += n$1 + " ";
              } else {
                progress += n$1 + b;
              }
            }
          }
        }
        setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
        anim.currentValue = progress;
        i++;
      }
    }
    function setCallback(cb) {
      if (instance[cb] && !instance.passThrough) {
        instance[cb](instance);
      }
    }
    function countIteration() {
      if (instance.remaining && instance.remaining !== true) {
        instance.remaining--;
      }
    }
    function setInstanceProgress(engineTime) {
      var insDuration = instance.duration;
      var insDelay = instance.delay;
      var insEndDelay = insDuration - instance.endDelay;
      var insTime = adjustTime(engineTime);
      instance.progress = minMax(insTime / insDuration * 100, 0, 100);
      instance.reversePlayback = insTime < instance.currentTime;
      if (children) {
        syncInstanceChildren(insTime);
      }
      if (!instance.began && instance.currentTime > 0) {
        instance.began = true;
        setCallback("begin");
      }
      if (!instance.loopBegan && instance.currentTime > 0) {
        instance.loopBegan = true;
        setCallback("loopBegin");
      }
      if (insTime <= insDelay && instance.currentTime !== 0) {
        setAnimationsProgress(0);
      }
      if (insTime >= insEndDelay && instance.currentTime !== insDuration || !insDuration) {
        setAnimationsProgress(insDuration);
      }
      if (insTime > insDelay && insTime < insEndDelay) {
        if (!instance.changeBegan) {
          instance.changeBegan = true;
          instance.changeCompleted = false;
          setCallback("changeBegin");
        }
        setCallback("change");
        setAnimationsProgress(insTime);
      } else {
        if (instance.changeBegan) {
          instance.changeCompleted = true;
          instance.changeBegan = false;
          setCallback("changeComplete");
        }
      }
      instance.currentTime = minMax(insTime, 0, insDuration);
      if (instance.began) {
        setCallback("update");
      }
      if (engineTime >= insDuration) {
        lastTime = 0;
        countIteration();
        if (!instance.remaining) {
          instance.paused = true;
          if (!instance.completed) {
            instance.completed = true;
            setCallback("loopComplete");
            setCallback("complete");
            if (!instance.passThrough && "Promise" in window) {
              resolve();
              makePromise(instance);
            }
          }
        } else {
          startTime = now;
          setCallback("loopComplete");
          instance.loopBegan = false;
          if (instance.direction === "alternate") {
            toggleInstanceDirection();
          }
        }
      }
    }
    instance.reset = function() {
      var direction = instance.direction;
      instance.passThrough = false;
      instance.currentTime = 0;
      instance.progress = 0;
      instance.paused = true;
      instance.began = false;
      instance.loopBegan = false;
      instance.changeBegan = false;
      instance.completed = false;
      instance.changeCompleted = false;
      instance.reversePlayback = false;
      instance.reversed = direction === "reverse";
      instance.remaining = instance.loop;
      children = instance.children;
      childrenLength = children.length;
      for (var i = childrenLength; i--; ) {
        instance.children[i].reset();
      }
      if (instance.reversed && instance.loop !== true || direction === "alternate" && instance.loop === 1) {
        instance.remaining++;
      }
      setAnimationsProgress(instance.reversed ? instance.duration : 0);
    };
    instance._onDocumentVisibility = resetTime;
    instance.set = function(targets, properties) {
      setTargetsValue(targets, properties);
      return instance;
    };
    instance.tick = function(t) {
      now = t;
      if (!startTime) {
        startTime = now;
      }
      setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
    };
    instance.seek = function(time) {
      setInstanceProgress(adjustTime(time));
    };
    instance.pause = function() {
      instance.paused = true;
      resetTime();
    };
    instance.play = function() {
      if (!instance.paused) {
        return;
      }
      if (instance.completed) {
        instance.reset();
      }
      instance.paused = false;
      activeInstances.push(instance);
      resetTime();
      engine();
    };
    instance.reverse = function() {
      toggleInstanceDirection();
      instance.completed = instance.reversed ? false : true;
      resetTime();
    };
    instance.restart = function() {
      instance.reset();
      instance.play();
    };
    instance.remove = function(targets) {
      var targetsArray = parseTargets(targets);
      removeTargetsFromInstance(targetsArray, instance);
    };
    instance.reset();
    if (instance.autoplay) {
      instance.play();
    }
    return instance;
  }
  function removeTargetsFromAnimations(targetsArray, animations) {
    for (var a = animations.length; a--; ) {
      if (arrayContains(targetsArray, animations[a].animatable.target)) {
        animations.splice(a, 1);
      }
    }
  }
  function removeTargetsFromInstance(targetsArray, instance) {
    var animations = instance.animations;
    var children = instance.children;
    removeTargetsFromAnimations(targetsArray, animations);
    for (var c = children.length; c--; ) {
      var child = children[c];
      var childAnimations = child.animations;
      removeTargetsFromAnimations(targetsArray, childAnimations);
      if (!childAnimations.length && !child.children.length) {
        children.splice(c, 1);
      }
    }
    if (!animations.length && !children.length) {
      instance.pause();
    }
  }
  function removeTargetsFromActiveInstances(targets) {
    var targetsArray = parseTargets(targets);
    for (var i = activeInstances.length; i--; ) {
      var instance = activeInstances[i];
      removeTargetsFromInstance(targetsArray, instance);
    }
  }
  function stagger(val, params) {
    if (params === void 0)
      params = {};
    var direction = params.direction || "normal";
    var easing = params.easing ? parseEasings(params.easing) : null;
    var grid = params.grid;
    var axis = params.axis;
    var fromIndex = params.from || 0;
    var fromFirst = fromIndex === "first";
    var fromCenter = fromIndex === "center";
    var fromLast = fromIndex === "last";
    var isRange = is.arr(val);
    var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
    var val2 = isRange ? parseFloat(val[1]) : 0;
    var unit = getUnit(isRange ? val[1] : val) || 0;
    var start = params.start || 0 + (isRange ? val1 : 0);
    var values = [];
    var maxValue = 0;
    return function(el, i, t) {
      if (fromFirst) {
        fromIndex = 0;
      }
      if (fromCenter) {
        fromIndex = (t - 1) / 2;
      }
      if (fromLast) {
        fromIndex = t - 1;
      }
      if (!values.length) {
        for (var index = 0; index < t; index++) {
          if (!grid) {
            values.push(Math.abs(fromIndex - index));
          } else {
            var fromX = !fromCenter ? fromIndex % grid[0] : (grid[0] - 1) / 2;
            var fromY = !fromCenter ? Math.floor(fromIndex / grid[0]) : (grid[1] - 1) / 2;
            var toX = index % grid[0];
            var toY = Math.floor(index / grid[0]);
            var distanceX = fromX - toX;
            var distanceY = fromY - toY;
            var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            if (axis === "x") {
              value = -distanceX;
            }
            if (axis === "y") {
              value = -distanceY;
            }
            values.push(value);
          }
          maxValue = Math.max.apply(Math, values);
        }
        if (easing) {
          values = values.map(function(val3) {
            return easing(val3 / maxValue) * maxValue;
          });
        }
        if (direction === "reverse") {
          values = values.map(function(val3) {
            return axis ? val3 < 0 ? val3 * -1 : -val3 : Math.abs(maxValue - val3);
          });
        }
      }
      var spacing = isRange ? (val2 - val1) / maxValue : val1;
      return start + spacing * (Math.round(values[i] * 100) / 100) + unit;
    };
  }
  function timeline(params) {
    if (params === void 0)
      params = {};
    var tl = anime(params);
    tl.duration = 0;
    tl.add = function(instanceParams, timelineOffset) {
      var tlIndex = activeInstances.indexOf(tl);
      var children = tl.children;
      if (tlIndex > -1) {
        activeInstances.splice(tlIndex, 1);
      }
      function passThrough(ins2) {
        ins2.passThrough = true;
      }
      for (var i = 0; i < children.length; i++) {
        passThrough(children[i]);
      }
      var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
      insParams.targets = insParams.targets || params.targets;
      var tlDuration = tl.duration;
      insParams.autoplay = false;
      insParams.direction = tl.direction;
      insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
      passThrough(tl);
      tl.seek(insParams.timelineOffset);
      var ins = anime(insParams);
      passThrough(ins);
      children.push(ins);
      var timings = getInstanceTimings(children, params);
      tl.delay = timings.delay;
      tl.endDelay = timings.endDelay;
      tl.duration = timings.duration;
      tl.seek(0);
      tl.reset();
      if (tl.autoplay) {
        tl.play();
      }
      return tl;
    };
    return tl;
  }
  anime.version = "3.2.1";
  anime.speed = 1;
  anime.suspendWhenDocumentHidden = true;
  anime.running = activeInstances;
  anime.remove = removeTargetsFromActiveInstances;
  anime.get = getOriginalTargetValue;
  anime.set = setTargetsValue;
  anime.convertPx = convertPxToUnit;
  anime.path = getPath;
  anime.setDashoffset = setDashoffset;
  anime.stagger = stagger;
  anime.timeline = timeline;
  anime.easing = parseEasings;
  anime.penner = penner;
  anime.random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var rellax = { exports: {} };
  (function(module) {
    (function(root, factory) {
      if (module.exports) {
        module.exports = factory();
      } else {
        root.Rellax = factory();
      }
    })(typeof window !== "undefined" ? window : commonjsGlobal, function() {
      var Rellax2 = function(el, options) {
        var self2 = Object.create(Rellax2.prototype);
        var posY = 0;
        var screenY = 0;
        var posX = 0;
        var screenX = 0;
        var blocks = [];
        var pause = true;
        var loop = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback) {
          return setTimeout(callback, 1e3 / 60);
        };
        var loopId = null;
        var supportsPassive = false;
        try {
          var opts = Object.defineProperty({}, "passive", {
            get: function() {
              supportsPassive = true;
            }
          });
          window.addEventListener("testPassive", null, opts);
          window.removeEventListener("testPassive", null, opts);
        } catch (e) {
        }
        var clearLoop = window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout;
        var transformProp = window.transformProp || function() {
          var testEl = document.createElement("div");
          if (testEl.style.transform === null) {
            var vendors = ["Webkit", "Moz", "ms"];
            for (var vendor in vendors) {
              if (testEl.style[vendors[vendor] + "Transform"] !== void 0) {
                return vendors[vendor] + "Transform";
              }
            }
          }
          return "transform";
        }();
        self2.options = {
          speed: -2,
          verticalSpeed: null,
          horizontalSpeed: null,
          breakpoints: [576, 768, 1201],
          center: false,
          wrapper: null,
          relativeToWrapper: false,
          round: true,
          vertical: true,
          horizontal: false,
          verticalScrollAxis: "y",
          horizontalScrollAxis: "x",
          callback: function() {
          }
        };
        if (options) {
          Object.keys(options).forEach(function(key) {
            self2.options[key] = options[key];
          });
        }
        function validateCustomBreakpoints() {
          if (self2.options.breakpoints.length === 3 && Array.isArray(self2.options.breakpoints)) {
            var isAscending = true;
            var isNumerical = true;
            var lastVal;
            self2.options.breakpoints.forEach(function(i) {
              if (typeof i !== "number")
                isNumerical = false;
              if (lastVal !== null) {
                if (i < lastVal)
                  isAscending = false;
              }
              lastVal = i;
            });
            if (isAscending && isNumerical)
              return;
          }
          self2.options.breakpoints = [576, 768, 1201];
          console.warn("Rellax: You must pass an array of 3 numbers in ascending order to the breakpoints option. Defaults reverted");
        }
        if (options && options.breakpoints) {
          validateCustomBreakpoints();
        }
        if (!el) {
          el = ".rellax";
        }
        var elements = typeof el === "string" ? document.querySelectorAll(el) : [el];
        if (elements.length > 0) {
          self2.elems = elements;
        } else {
          console.warn("Rellax: The elements you're trying to select don't exist.");
          return;
        }
        if (self2.options.wrapper) {
          if (!self2.options.wrapper.nodeType) {
            var wrapper = document.querySelector(self2.options.wrapper);
            if (wrapper) {
              self2.options.wrapper = wrapper;
            } else {
              console.warn("Rellax: The wrapper you're trying to use doesn't exist.");
              return;
            }
          }
        }
        var currentBreakpoint;
        var getCurrentBreakpoint = function(w) {
          var bp = self2.options.breakpoints;
          if (w < bp[0])
            return "xs";
          if (w >= bp[0] && w < bp[1])
            return "sm";
          if (w >= bp[1] && w < bp[2])
            return "md";
          return "lg";
        };
        var cacheBlocks = function() {
          for (var i = 0; i < self2.elems.length; i++) {
            var block = createBlock(self2.elems[i]);
            blocks.push(block);
          }
        };
        var init = function() {
          for (var i = 0; i < blocks.length; i++) {
            self2.elems[i].style.cssText = blocks[i].style;
          }
          blocks = [];
          screenY = window.innerHeight;
          screenX = window.innerWidth;
          currentBreakpoint = getCurrentBreakpoint(screenX);
          setPosition();
          cacheBlocks();
          animate();
          if (pause) {
            window.addEventListener("resize", init);
            pause = false;
            update();
          }
        };
        var createBlock = function(el2) {
          var dataPercentage = el2.getAttribute("data-rellax-percentage");
          var dataSpeed = el2.getAttribute("data-rellax-speed");
          var dataXsSpeed = el2.getAttribute("data-rellax-xs-speed");
          var dataMobileSpeed = el2.getAttribute("data-rellax-mobile-speed");
          var dataTabletSpeed = el2.getAttribute("data-rellax-tablet-speed");
          var dataDesktopSpeed = el2.getAttribute("data-rellax-desktop-speed");
          var dataVerticalSpeed = el2.getAttribute("data-rellax-vertical-speed");
          var dataHorizontalSpeed = el2.getAttribute("data-rellax-horizontal-speed");
          var dataVericalScrollAxis = el2.getAttribute("data-rellax-vertical-scroll-axis");
          var dataHorizontalScrollAxis = el2.getAttribute("data-rellax-horizontal-scroll-axis");
          var dataZindex = el2.getAttribute("data-rellax-zindex") || 0;
          var dataMin = el2.getAttribute("data-rellax-min");
          var dataMax = el2.getAttribute("data-rellax-max");
          var dataMinX = el2.getAttribute("data-rellax-min-x");
          var dataMaxX = el2.getAttribute("data-rellax-max-x");
          var dataMinY = el2.getAttribute("data-rellax-min-y");
          var dataMaxY = el2.getAttribute("data-rellax-max-y");
          var mapBreakpoints;
          var breakpoints = true;
          if (!dataXsSpeed && !dataMobileSpeed && !dataTabletSpeed && !dataDesktopSpeed) {
            breakpoints = false;
          } else {
            mapBreakpoints = {
              "xs": dataXsSpeed,
              "sm": dataMobileSpeed,
              "md": dataTabletSpeed,
              "lg": dataDesktopSpeed
            };
          }
          var wrapperPosY = self2.options.wrapper ? self2.options.wrapper.scrollTop : window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
          if (self2.options.relativeToWrapper) {
            var scrollPosY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            wrapperPosY = scrollPosY - self2.options.wrapper.offsetTop;
          }
          var posY2 = self2.options.vertical ? dataPercentage || self2.options.center ? wrapperPosY : 0 : 0;
          var posX2 = self2.options.horizontal ? dataPercentage || self2.options.center ? self2.options.wrapper ? self2.options.wrapper.scrollLeft : window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft : 0 : 0;
          var blockTop = posY2 + el2.getBoundingClientRect().top;
          var blockHeight = el2.clientHeight || el2.offsetHeight || el2.scrollHeight;
          var blockLeft = posX2 + el2.getBoundingClientRect().left;
          var blockWidth = el2.clientWidth || el2.offsetWidth || el2.scrollWidth;
          var percentageY = dataPercentage ? dataPercentage : (posY2 - blockTop + screenY) / (blockHeight + screenY);
          var percentageX = dataPercentage ? dataPercentage : (posX2 - blockLeft + screenX) / (blockWidth + screenX);
          if (self2.options.center) {
            percentageX = 0.5;
            percentageY = 0.5;
          }
          var speed = breakpoints && mapBreakpoints[currentBreakpoint] !== null ? Number(mapBreakpoints[currentBreakpoint]) : dataSpeed ? dataSpeed : self2.options.speed;
          var verticalSpeed = dataVerticalSpeed ? dataVerticalSpeed : self2.options.verticalSpeed;
          var horizontalSpeed = dataHorizontalSpeed ? dataHorizontalSpeed : self2.options.horizontalSpeed;
          var verticalScrollAxis = dataVericalScrollAxis ? dataVericalScrollAxis : self2.options.verticalScrollAxis;
          var horizontalScrollAxis = dataHorizontalScrollAxis ? dataHorizontalScrollAxis : self2.options.horizontalScrollAxis;
          var bases = updatePosition(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed);
          var style = el2.style.cssText;
          var transform = "";
          var searchResult = /transform\s*:/i.exec(style);
          if (searchResult) {
            var index = searchResult.index;
            var trimmedStyle = style.slice(index);
            var delimiter = trimmedStyle.indexOf(";");
            if (delimiter) {
              transform = " " + trimmedStyle.slice(11, delimiter).replace(/\s/g, "");
            } else {
              transform = " " + trimmedStyle.slice(11).replace(/\s/g, "");
            }
          }
          return {
            baseX: bases.x,
            baseY: bases.y,
            top: blockTop,
            left: blockLeft,
            height: blockHeight,
            width: blockWidth,
            speed,
            verticalSpeed,
            horizontalSpeed,
            verticalScrollAxis,
            horizontalScrollAxis,
            style,
            transform,
            zindex: dataZindex,
            min: dataMin,
            max: dataMax,
            minX: dataMinX,
            maxX: dataMaxX,
            minY: dataMinY,
            maxY: dataMaxY
          };
        };
        var setPosition = function() {
          var oldY = posY;
          var oldX = posX;
          posY = self2.options.wrapper ? self2.options.wrapper.scrollTop : (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
          posX = self2.options.wrapper ? self2.options.wrapper.scrollLeft : (document.documentElement || document.body.parentNode || document.body).scrollLeft || window.pageXOffset;
          if (self2.options.relativeToWrapper) {
            var scrollPosY = (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
            posY = scrollPosY - self2.options.wrapper.offsetTop;
          }
          if (oldY != posY && self2.options.vertical) {
            return true;
          }
          if (oldX != posX && self2.options.horizontal) {
            return true;
          }
          return false;
        };
        var updatePosition = function(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed) {
          var result = {};
          var valueX = (horizontalSpeed ? horizontalSpeed : speed) * (100 * (1 - percentageX));
          var valueY = (verticalSpeed ? verticalSpeed : speed) * (100 * (1 - percentageY));
          result.x = self2.options.round ? Math.round(valueX) : Math.round(valueX * 100) / 100;
          result.y = self2.options.round ? Math.round(valueY) : Math.round(valueY * 100) / 100;
          return result;
        };
        var deferredUpdate = function() {
          window.removeEventListener("resize", deferredUpdate);
          window.removeEventListener("orientationchange", deferredUpdate);
          (self2.options.wrapper ? self2.options.wrapper : window).removeEventListener("scroll", deferredUpdate);
          (self2.options.wrapper ? self2.options.wrapper : document).removeEventListener("touchmove", deferredUpdate);
          loopId = loop(update);
        };
        var update = function() {
          if (setPosition() && pause === false) {
            animate();
            loopId = loop(update);
          } else {
            loopId = null;
            window.addEventListener("resize", deferredUpdate);
            window.addEventListener("orientationchange", deferredUpdate);
            (self2.options.wrapper ? self2.options.wrapper : window).addEventListener("scroll", deferredUpdate, supportsPassive ? { passive: true } : false);
            (self2.options.wrapper ? self2.options.wrapper : document).addEventListener("touchmove", deferredUpdate, supportsPassive ? { passive: true } : false);
          }
        };
        var animate = function() {
          var positions;
          for (var i = 0; i < self2.elems.length; i++) {
            var verticalScrollAxis = blocks[i].verticalScrollAxis.toLowerCase();
            var horizontalScrollAxis = blocks[i].horizontalScrollAxis.toLowerCase();
            var verticalScrollX = verticalScrollAxis.indexOf("x") != -1 ? posY : 0;
            var verticalScrollY = verticalScrollAxis.indexOf("y") != -1 ? posY : 0;
            var horizontalScrollX = horizontalScrollAxis.indexOf("x") != -1 ? posX : 0;
            var horizontalScrollY = horizontalScrollAxis.indexOf("y") != -1 ? posX : 0;
            var percentageY = (verticalScrollY + horizontalScrollY - blocks[i].top + screenY) / (blocks[i].height + screenY);
            var percentageX = (verticalScrollX + horizontalScrollX - blocks[i].left + screenX) / (blocks[i].width + screenX);
            positions = updatePosition(percentageX, percentageY, blocks[i].speed, blocks[i].verticalSpeed, blocks[i].horizontalSpeed);
            var positionY = positions.y - blocks[i].baseY;
            var positionX = positions.x - blocks[i].baseX;
            if (blocks[i].min !== null) {
              if (self2.options.vertical && !self2.options.horizontal) {
                positionY = positionY <= blocks[i].min ? blocks[i].min : positionY;
              }
              if (self2.options.horizontal && !self2.options.vertical) {
                positionX = positionX <= blocks[i].min ? blocks[i].min : positionX;
              }
            }
            if (blocks[i].minY != null) {
              positionY = positionY <= blocks[i].minY ? blocks[i].minY : positionY;
            }
            if (blocks[i].minX != null) {
              positionX = positionX <= blocks[i].minX ? blocks[i].minX : positionX;
            }
            if (blocks[i].max !== null) {
              if (self2.options.vertical && !self2.options.horizontal) {
                positionY = positionY >= blocks[i].max ? blocks[i].max : positionY;
              }
              if (self2.options.horizontal && !self2.options.vertical) {
                positionX = positionX >= blocks[i].max ? blocks[i].max : positionX;
              }
            }
            if (blocks[i].maxY != null) {
              positionY = positionY >= blocks[i].maxY ? blocks[i].maxY : positionY;
            }
            if (blocks[i].maxX != null) {
              positionX = positionX >= blocks[i].maxX ? blocks[i].maxX : positionX;
            }
            var zindex = blocks[i].zindex;
            var translate = "translate3d(" + (self2.options.horizontal ? positionX : "0") + "px," + (self2.options.vertical ? positionY : "0") + "px," + zindex + "px) " + blocks[i].transform;
            self2.elems[i].style[transformProp] = translate;
          }
          self2.options.callback(positions);
        };
        self2.destroy = function() {
          for (var i = 0; i < self2.elems.length; i++) {
            self2.elems[i].style.cssText = blocks[i].style;
          }
          if (!pause) {
            window.removeEventListener("resize", init);
            pause = true;
          }
          clearLoop(loopId);
          loopId = null;
        };
        init();
        self2.refresh = init;
        return self2;
      };
      return Rellax2;
    });
  })(rellax);
  const Rellax = rellax.exports;
  (() => {
    function _toConsumableArray(arr) {
      return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return _arrayLikeToArray(o, minLen);
    }
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return _arrayLikeToArray(arr);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        _defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var Default = {
      alwaysOpen: false,
      activeClasses: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
      inactiveClasses: "text-gray-500 dark:text-gray-400",
      onOpen: function onOpen() {
      },
      onClose: function onClose() {
      },
      onToggle: function onToggle() {
      }
    };
    var Accordion = /* @__PURE__ */ function() {
      function Accordion2() {
        var items = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        _classCallCheck(this, Accordion2);
        this._items = items;
        this._options = _objectSpread(_objectSpread({}, Default), options);
        this._init();
      }
      _createClass(Accordion2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._items.length) {
            this._items.map(function(item) {
              if (item.active) {
                _this.open(item.id);
              }
              item.triggerEl.addEventListener("click", function() {
                _this.toggle(item.id);
              });
            });
          }
        }
      }, {
        key: "getItem",
        value: function getItem(id) {
          return this._items.filter(function(item) {
            return item.id === id;
          })[0];
        }
      }, {
        key: "open",
        value: function open(id) {
          var _this2 = this, _item$triggerEl$class, _item$triggerEl$class2;
          var item = this.getItem(id);
          if (!this._options.alwaysOpen) {
            this._items.map(function(i) {
              if (i !== item) {
                var _i$triggerEl$classLis, _i$triggerEl$classLis2;
                (_i$triggerEl$classLis = i.triggerEl.classList).remove.apply(_i$triggerEl$classLis, _toConsumableArray(_this2._options.activeClasses.split(" ")));
                (_i$triggerEl$classLis2 = i.triggerEl.classList).add.apply(_i$triggerEl$classLis2, _toConsumableArray(_this2._options.inactiveClasses.split(" ")));
                i.targetEl.classList.add("hidden");
                i.triggerEl.setAttribute("aria-expanded", false);
                i.active = false;
                if (i.iconEl) {
                  i.iconEl.classList.remove("rotate-180");
                }
              }
            });
          }
          (_item$triggerEl$class = item.triggerEl.classList).add.apply(_item$triggerEl$class, _toConsumableArray(this._options.activeClasses.split(" ")));
          (_item$triggerEl$class2 = item.triggerEl.classList).remove.apply(_item$triggerEl$class2, _toConsumableArray(this._options.inactiveClasses.split(" ")));
          item.triggerEl.setAttribute("aria-expanded", true);
          item.targetEl.classList.remove("hidden");
          item.active = true;
          if (item.iconEl) {
            item.iconEl.classList.add("rotate-180");
          }
          this._options.onOpen(this, item);
        }
      }, {
        key: "toggle",
        value: function toggle(id) {
          var item = this.getItem(id);
          if (item.active) {
            this.close(id);
          } else {
            this.open(id);
          }
          this._options.onToggle(this, item);
        }
      }, {
        key: "close",
        value: function close(id) {
          var _item$triggerEl$class3, _item$triggerEl$class4;
          var item = this.getItem(id);
          (_item$triggerEl$class3 = item.triggerEl.classList).remove.apply(_item$triggerEl$class3, _toConsumableArray(this._options.activeClasses.split(" ")));
          (_item$triggerEl$class4 = item.triggerEl.classList).add.apply(_item$triggerEl$class4, _toConsumableArray(this._options.inactiveClasses.split(" ")));
          item.targetEl.classList.add("hidden");
          item.triggerEl.setAttribute("aria-expanded", false);
          item.active = false;
          if (item.iconEl) {
            item.iconEl.classList.remove("rotate-180");
          }
          this._options.onClose(this, item);
        }
      }]);
      return Accordion2;
    }();
    window.Accordion = Accordion;
    function initAccordion() {
      document.querySelectorAll("[data-accordion]").forEach(function(accordionEl) {
        var alwaysOpen = accordionEl.getAttribute("data-accordion");
        var activeClasses = accordionEl.getAttribute("data-active-classes");
        var inactiveClasses = accordionEl.getAttribute("data-inactive-classes");
        var items = [];
        accordionEl.querySelectorAll("[data-accordion-target]").forEach(function(el) {
          var item = {
            id: el.getAttribute("data-accordion-target"),
            triggerEl: el,
            targetEl: document.querySelector(el.getAttribute("data-accordion-target")),
            iconEl: el.querySelector("[data-accordion-icon]"),
            active: el.getAttribute("aria-expanded") === "true" ? true : false
          };
          items.push(item);
        });
        new Accordion(items, {
          alwaysOpen: alwaysOpen === "open" ? true : false,
          activeClasses: activeClasses ? activeClasses : Default.activeClasses,
          inactiveClasses: inactiveClasses ? inactiveClasses : Default.inactiveClasses
        });
      });
    }
    if (document.readyState !== "loading") {
      initAccordion();
    } else {
      document.addEventListener("DOMContentLoaded", initAccordion);
    }
    function collapse_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function collapse_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? collapse_ownKeys(Object(source), true).forEach(function(key) {
          collapse_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : collapse_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function collapse_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function collapse_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function collapse_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function collapse_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        collapse_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        collapse_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var collapse_Default = {
      triggerEl: null,
      onCollapse: function onCollapse() {
      },
      onExpand: function onExpand() {
      },
      onToggle: function onToggle() {
      }
    };
    var Collapse = /* @__PURE__ */ function() {
      function Collapse2() {
        var targetEl = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var options = arguments.length > 1 ? arguments[1] : void 0;
        collapse_classCallCheck(this, Collapse2);
        this._targetEl = targetEl;
        this._triggerEl = options ? options.triggerEl : collapse_Default.triggerEl;
        this._options = collapse_objectSpread(collapse_objectSpread({}, collapse_Default), options);
        this._visible = false;
        this._init();
      }
      collapse_createClass(Collapse2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._triggerEl) {
            if (this._triggerEl.hasAttribute("aria-expanded")) {
              this._visible = this._triggerEl.getAttribute("aria-expanded") === "true" ? true : false;
            } else {
              this._visible = this._targetEl.classList.contains("hidden") ? false : true;
            }
            this._triggerEl.addEventListener("click", function() {
              _this._visible ? _this.collapse() : _this.expand();
            });
          }
        }
      }, {
        key: "collapse",
        value: function collapse() {
          this._targetEl.classList.add("hidden");
          if (this._triggerEl) {
            this._triggerEl.setAttribute("aria-expanded", "false");
          }
          this._visible = false;
          this._options.onCollapse(this);
        }
      }, {
        key: "expand",
        value: function expand() {
          this._targetEl.classList.remove("hidden");
          if (this._triggerEl) {
            this._triggerEl.setAttribute("aria-expanded", "true");
          }
          this._visible = true;
          this._options.onExpand(this);
        }
      }, {
        key: "toggle",
        value: function toggle() {
          if (this._visible) {
            this.collapse();
          } else {
            this.expand();
          }
        }
      }]);
      return Collapse2;
    }();
    window.Collapse = Collapse;
    function initCollapse() {
      document.querySelectorAll("[data-collapse-toggle]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-collapse-toggle"));
        new Collapse(targetEl, {
          triggerEl
        });
      });
    }
    if (document.readyState !== "loading") {
      initCollapse();
    } else {
      document.addEventListener("DOMContentLoaded", initCollapse);
    }
    function carousel_toConsumableArray(arr) {
      return carousel_arrayWithoutHoles(arr) || carousel_iterableToArray(arr) || carousel_unsupportedIterableToArray(arr) || carousel_nonIterableSpread();
    }
    function carousel_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function carousel_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return carousel_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return carousel_arrayLikeToArray(o, minLen);
    }
    function carousel_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function carousel_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return carousel_arrayLikeToArray(arr);
    }
    function carousel_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function carousel_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function carousel_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? carousel_ownKeys(Object(source), true).forEach(function(key) {
          carousel_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : carousel_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function carousel_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function carousel_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function carousel_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function carousel_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        carousel_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        carousel_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var carousel_Default = {
      defaultPosition: 0,
      indicators: {
        items: [],
        activeClasses: "bg-white dark:bg-gray-800",
        inactiveClasses: "bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
      },
      interval: 3e3,
      onNext: function onNext() {
      },
      onPrev: function onPrev() {
      },
      onChange: function onChange() {
      }
    };
    var Carousel = /* @__PURE__ */ function() {
      function Carousel2() {
        var items = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        carousel_classCallCheck(this, Carousel2);
        this._items = items;
        this._options = carousel_objectSpread(carousel_objectSpread(carousel_objectSpread({}, carousel_Default), options), {}, {
          indicators: carousel_objectSpread(carousel_objectSpread({}, carousel_Default.indicators), options.indicators)
        });
        this._activeItem = this.getItem(this._options.defaultPosition);
        this._indicators = this._options.indicators.items;
        this._interval = null;
        this._init();
      }
      carousel_createClass(Carousel2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          this._items.map(function(item) {
            item.el.classList.add("absolute", "inset-0", "transition-all", "transform");
          });
          if (this._getActiveItem()) {
            this.slideTo(this._getActiveItem().position);
          } else {
            this.slideTo(0);
          }
          this._indicators.map(function(indicator, position) {
            indicator.el.addEventListener("click", function() {
              _this.slideTo(position);
            });
          });
        }
      }, {
        key: "getItem",
        value: function getItem(position) {
          return this._items[position];
        }
      }, {
        key: "slideTo",
        value: function slideTo(position) {
          var nextItem = this._items[position];
          var rotationItems = {
            "left": nextItem.position === 0 ? this._items[this._items.length - 1] : this._items[nextItem.position - 1],
            "middle": nextItem,
            "right": nextItem.position === this._items.length - 1 ? this._items[0] : this._items[nextItem.position + 1]
          };
          this._rotate(rotationItems);
          this._setActiveItem(nextItem.position);
          if (this._interval) {
            this.pause();
            this.cycle();
          }
          this._options.onChange(this);
        }
      }, {
        key: "next",
        value: function next() {
          var activeItem = this._getActiveItem();
          var nextItem = null;
          if (activeItem.position === this._items.length - 1) {
            nextItem = this._items[0];
          } else {
            nextItem = this._items[activeItem.position + 1];
          }
          this.slideTo(nextItem.position);
          this._options.onNext(this);
        }
      }, {
        key: "prev",
        value: function prev() {
          var activeItem = this._getActiveItem();
          var prevItem = null;
          if (activeItem.position === 0) {
            prevItem = this._items[this._items.length - 1];
          } else {
            prevItem = this._items[activeItem.position - 1];
          }
          this.slideTo(prevItem.position);
          this._options.onPrev(this);
        }
      }, {
        key: "_rotate",
        value: function _rotate(rotationItems) {
          this._items.map(function(item) {
            item.el.classList.add("hidden");
          });
          rotationItems.left.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-20");
          rotationItems.left.el.classList.add("-translate-x-full", "z-10");
          rotationItems.middle.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-10");
          rotationItems.middle.el.classList.add("translate-x-0", "z-20");
          rotationItems.right.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-20");
          rotationItems.right.el.classList.add("translate-x-full", "z-10");
        }
      }, {
        key: "cycle",
        value: function cycle() {
          var _this2 = this;
          this._interval = setInterval(function() {
            _this2.next();
          }, this._options.interval);
        }
      }, {
        key: "pause",
        value: function pause() {
          clearInterval(this._interval);
        }
      }, {
        key: "_getActiveItem",
        value: function _getActiveItem() {
          return this._activeItem;
        }
      }, {
        key: "_setActiveItem",
        value: function _setActiveItem(position) {
          var _this3 = this;
          this._activeItem = this._items[position];
          if (this._indicators.length) {
            var _this$_indicators$pos, _this$_indicators$pos2;
            this._indicators.map(function(indicator) {
              var _indicator$el$classLi, _indicator$el$classLi2;
              indicator.el.setAttribute("aria-current", "false");
              (_indicator$el$classLi = indicator.el.classList).remove.apply(_indicator$el$classLi, carousel_toConsumableArray(_this3._options.indicators.activeClasses.split(" ")));
              (_indicator$el$classLi2 = indicator.el.classList).add.apply(_indicator$el$classLi2, carousel_toConsumableArray(_this3._options.indicators.inactiveClasses.split(" ")));
            });
            (_this$_indicators$pos = this._indicators[position].el.classList).add.apply(_this$_indicators$pos, carousel_toConsumableArray(this._options.indicators.activeClasses.split(" ")));
            (_this$_indicators$pos2 = this._indicators[position].el.classList).remove.apply(_this$_indicators$pos2, carousel_toConsumableArray(this._options.indicators.inactiveClasses.split(" ")));
            this._indicators[position].el.setAttribute("aria-current", "true");
          }
        }
      }]);
      return Carousel2;
    }();
    window.Carousel = Carousel;
    function initCarousel() {
      document.querySelectorAll("[data-carousel]").forEach(function(carouselEl) {
        var interval = carouselEl.getAttribute("data-carousel-interval");
        var slide = carouselEl.getAttribute("data-carousel") === "slide" ? true : false;
        var items = [];
        var defaultPosition = 0;
        if (carouselEl.querySelectorAll("[data-carousel-item]").length) {
          carousel_toConsumableArray(carouselEl.querySelectorAll("[data-carousel-item]")).map(function(carouselItemEl, position) {
            items.push({
              position,
              el: carouselItemEl
            });
            if (carouselItemEl.getAttribute("data-carousel-item") === "active") {
              defaultPosition = position;
            }
          });
        }
        var indicators = [];
        if (carouselEl.querySelectorAll("[data-carousel-slide-to]").length) {
          carousel_toConsumableArray(carouselEl.querySelectorAll("[data-carousel-slide-to]")).map(function(indicatorEl) {
            indicators.push({
              position: indicatorEl.getAttribute("data-carousel-slide-to"),
              el: indicatorEl
            });
          });
        }
        var carousel = new Carousel(items, {
          defaultPosition,
          indicators: {
            items: indicators
          },
          interval: interval ? interval : carousel_Default.interval
        });
        if (slide) {
          carousel.cycle();
        }
        var carouselNextEl = carouselEl.querySelector("[data-carousel-next]");
        var carouselPrevEl = carouselEl.querySelector("[data-carousel-prev]");
        if (carouselNextEl) {
          carouselNextEl.addEventListener("click", function() {
            carousel.next();
          });
        }
        if (carouselPrevEl) {
          carouselPrevEl.addEventListener("click", function() {
            carousel.prev();
          });
        }
      });
    }
    if (document.readyState !== "loading") {
      initCarousel();
    } else {
      document.addEventListener("DOMContentLoaded", initCarousel);
    }
    function dismiss_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function dismiss_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? dismiss_ownKeys(Object(source), true).forEach(function(key) {
          dismiss_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : dismiss_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function dismiss_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function dismiss_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function dismiss_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function dismiss_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        dismiss_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        dismiss_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var dismiss_Default = {
      triggerEl: null,
      transition: "transition-opacity",
      duration: 300,
      timing: "ease-out",
      onHide: function onHide() {
      }
    };
    var Dismiss = /* @__PURE__ */ function() {
      function Dismiss2() {
        var targetEl = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        dismiss_classCallCheck(this, Dismiss2);
        this._targetEl = targetEl;
        this._triggerEl = options ? options.triggerEl : dismiss_Default.triggerEl;
        this._options = dismiss_objectSpread(dismiss_objectSpread({}, dismiss_Default), options);
        this._init();
      }
      dismiss_createClass(Dismiss2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._triggerEl) {
            this._triggerEl.addEventListener("click", function() {
              _this.hide();
            });
          }
        }
      }, {
        key: "hide",
        value: function hide2() {
          var _this2 = this;
          this._targetEl.classList.add(this._options.transition, "duration-".concat(this._options.duration), this._options.timing, "opacity-0");
          setTimeout(function() {
            _this2._targetEl.classList.add("hidden");
          }, this._options.duration);
          this._options.onHide(this, this._targetEl);
        }
      }]);
      return Dismiss2;
    }();
    window.Dismiss = Dismiss;
    function initDismiss() {
      document.querySelectorAll("[data-dismiss-target]").forEach(function(triggerEl) {
        var targetEl = document.querySelector(triggerEl.getAttribute("data-dismiss-target"));
        new Dismiss(targetEl, {
          triggerEl
        });
      });
    }
    if (document.readyState !== "loading") {
      initDismiss();
    } else {
      document.addEventListener("DOMContentLoaded", initDismiss);
    }
    function getWindow(node) {
      if (node == null) {
        return window;
      }
      if (node.toString() !== "[object Window]") {
        var ownerDocument = node.ownerDocument;
        return ownerDocument ? ownerDocument.defaultView || window : window;
      }
      return node;
    }
    function isElement(node) {
      var OwnElement = getWindow(node).Element;
      return node instanceof OwnElement || node instanceof Element;
    }
    function isHTMLElement(node) {
      var OwnElement = getWindow(node).HTMLElement;
      return node instanceof OwnElement || node instanceof HTMLElement;
    }
    function isShadowRoot(node) {
      if (typeof ShadowRoot === "undefined") {
        return false;
      }
      var OwnElement = getWindow(node).ShadowRoot;
      return node instanceof OwnElement || node instanceof ShadowRoot;
    }
    var math_max = Math.max;
    var math_min = Math.min;
    var round = Math.round;
    function getBoundingClientRect(element, includeScale) {
      if (includeScale === void 0) {
        includeScale = false;
      }
      var rect = element.getBoundingClientRect();
      var scaleX = 1;
      var scaleY = 1;
      if (isHTMLElement(element) && includeScale) {
        var offsetHeight = element.offsetHeight;
        var offsetWidth = element.offsetWidth;
        if (offsetWidth > 0) {
          scaleX = round(rect.width) / offsetWidth || 1;
        }
        if (offsetHeight > 0) {
          scaleY = round(rect.height) / offsetHeight || 1;
        }
      }
      return {
        width: rect.width / scaleX,
        height: rect.height / scaleY,
        top: rect.top / scaleY,
        right: rect.right / scaleX,
        bottom: rect.bottom / scaleY,
        left: rect.left / scaleX,
        x: rect.left / scaleX,
        y: rect.top / scaleY
      };
    }
    function getWindowScroll(node) {
      var win = getWindow(node);
      var scrollLeft = win.pageXOffset;
      var scrollTop = win.pageYOffset;
      return {
        scrollLeft,
        scrollTop
      };
    }
    function getHTMLElementScroll(element) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    function getNodeScroll(node) {
      if (node === getWindow(node) || !isHTMLElement(node)) {
        return getWindowScroll(node);
      } else {
        return getHTMLElementScroll(node);
      }
    }
    function getNodeName(element) {
      return element ? (element.nodeName || "").toLowerCase() : null;
    }
    function getDocumentElement(element) {
      return ((isElement(element) ? element.ownerDocument : element.document) || window.document).documentElement;
    }
    function getWindowScrollBarX(element) {
      return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
    }
    function getComputedStyle2(element) {
      return getWindow(element).getComputedStyle(element);
    }
    function isScrollParent(element) {
      var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
      return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }
    function isElementScaled(element) {
      var rect = element.getBoundingClientRect();
      var scaleX = round(rect.width) / element.offsetWidth || 1;
      var scaleY = round(rect.height) / element.offsetHeight || 1;
      return scaleX !== 1 || scaleY !== 1;
    }
    function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
      if (isFixed === void 0) {
        isFixed = false;
      }
      var isOffsetParentAnElement = isHTMLElement(offsetParent);
      var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
      var documentElement = getDocumentElement(offsetParent);
      var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled);
      var scroll = {
        scrollLeft: 0,
        scrollTop: 0
      };
      var offsets = {
        x: 0,
        y: 0
      };
      if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
        if (getNodeName(offsetParent) !== "body" || isScrollParent(documentElement)) {
          scroll = getNodeScroll(offsetParent);
        }
        if (isHTMLElement(offsetParent)) {
          offsets = getBoundingClientRect(offsetParent, true);
          offsets.x += offsetParent.clientLeft;
          offsets.y += offsetParent.clientTop;
        } else if (documentElement) {
          offsets.x = getWindowScrollBarX(documentElement);
        }
      }
      return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.top + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
      };
    }
    function getLayoutRect(element) {
      var clientRect = getBoundingClientRect(element);
      var width = element.offsetWidth;
      var height = element.offsetHeight;
      if (Math.abs(clientRect.width - width) <= 1) {
        width = clientRect.width;
      }
      if (Math.abs(clientRect.height - height) <= 1) {
        height = clientRect.height;
      }
      return {
        x: element.offsetLeft,
        y: element.offsetTop,
        width,
        height
      };
    }
    function getParentNode(element) {
      if (getNodeName(element) === "html") {
        return element;
      }
      return element.assignedSlot || element.parentNode || (isShadowRoot(element) ? element.host : null) || getDocumentElement(element);
    }
    function getScrollParent(node) {
      if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
        return node.ownerDocument.body;
      }
      if (isHTMLElement(node) && isScrollParent(node)) {
        return node;
      }
      return getScrollParent(getParentNode(node));
    }
    function listScrollParents(element, list) {
      var _element$ownerDocumen;
      if (list === void 0) {
        list = [];
      }
      var scrollParent = getScrollParent(element);
      var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
      var win = getWindow(scrollParent);
      var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
      var updatedList = list.concat(target);
      return isBody ? updatedList : updatedList.concat(listScrollParents(getParentNode(target)));
    }
    function isTableElement(element) {
      return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
    }
    function getTrueOffsetParent(element) {
      if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
        return null;
      }
      return element.offsetParent;
    }
    function getContainingBlock(element) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;
      var isIE = navigator.userAgent.indexOf("Trident") !== -1;
      if (isIE && isHTMLElement(element)) {
        var elementCss = getComputedStyle2(element);
        if (elementCss.position === "fixed") {
          return null;
        }
      }
      var currentNode = getParentNode(element);
      while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
        var css = getComputedStyle2(currentNode);
        if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
          return currentNode;
        } else {
          currentNode = currentNode.parentNode;
        }
      }
      return null;
    }
    function getOffsetParent(element) {
      var window2 = getWindow(element);
      var offsetParent = getTrueOffsetParent(element);
      while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
        offsetParent = getTrueOffsetParent(offsetParent);
      }
      if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
        return window2;
      }
      return offsetParent || getContainingBlock(element) || window2;
    }
    var enums_top = "top";
    var bottom = "bottom";
    var right = "right";
    var left = "left";
    var auto = "auto";
    var basePlacements = [enums_top, bottom, right, left];
    var start = "start";
    var end = "end";
    var clippingParents = "clippingParents";
    var viewport = "viewport";
    var popper = "popper";
    var reference = "reference";
    var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
      return acc.concat([placement + "-" + start, placement + "-" + end]);
    }, []);
    var enums_placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
      return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
    }, []);
    var beforeRead = "beforeRead";
    var read = "read";
    var afterRead = "afterRead";
    var beforeMain = "beforeMain";
    var main = "main";
    var afterMain = "afterMain";
    var beforeWrite = "beforeWrite";
    var write = "write";
    var afterWrite = "afterWrite";
    var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];
    function order(modifiers) {
      var map = /* @__PURE__ */ new Map();
      var visited = /* @__PURE__ */ new Set();
      var result = [];
      modifiers.forEach(function(modifier) {
        map.set(modifier.name, modifier);
      });
      function sort(modifier) {
        visited.add(modifier.name);
        var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
        requires.forEach(function(dep) {
          if (!visited.has(dep)) {
            var depModifier = map.get(dep);
            if (depModifier) {
              sort(depModifier);
            }
          }
        });
        result.push(modifier);
      }
      modifiers.forEach(function(modifier) {
        if (!visited.has(modifier.name)) {
          sort(modifier);
        }
      });
      return result;
    }
    function orderModifiers(modifiers) {
      var orderedModifiers = order(modifiers);
      return modifierPhases.reduce(function(acc, phase) {
        return acc.concat(orderedModifiers.filter(function(modifier) {
          return modifier.phase === phase;
        }));
      }, []);
    }
    function debounce(fn) {
      var pending;
      return function() {
        if (!pending) {
          pending = new Promise(function(resolve) {
            Promise.resolve().then(function() {
              pending = void 0;
              resolve(fn());
            });
          });
        }
        return pending;
      };
    }
    function mergeByName(modifiers) {
      var merged = modifiers.reduce(function(merged2, current) {
        var existing = merged2[current.name];
        merged2[current.name] = existing ? Object.assign({}, existing, current, {
          options: Object.assign({}, existing.options, current.options),
          data: Object.assign({}, existing.data, current.data)
        }) : current;
        return merged2;
      }, {});
      return Object.keys(merged).map(function(key) {
        return merged[key];
      });
    }
    var DEFAULT_OPTIONS = {
      placement: "bottom",
      modifiers: [],
      strategy: "absolute"
    };
    function areValidElements() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return !args.some(function(element) {
        return !(element && typeof element.getBoundingClientRect === "function");
      });
    }
    function popperGenerator(generatorOptions) {
      if (generatorOptions === void 0) {
        generatorOptions = {};
      }
      var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers2 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
      return function createPopper(reference2, popper2, options) {
        if (options === void 0) {
          options = defaultOptions;
        }
        var state = {
          placement: "bottom",
          orderedModifiers: [],
          options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
          modifiersData: {},
          elements: {
            reference: reference2,
            popper: popper2
          },
          attributes: {},
          styles: {}
        };
        var effectCleanupFns = [];
        var isDestroyed = false;
        var instance = {
          state,
          setOptions: function setOptions(setOptionsAction) {
            var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
            cleanupModifierEffects();
            state.options = Object.assign({}, defaultOptions, state.options, options2);
            state.scrollParents = {
              reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
              popper: listScrollParents(popper2)
            };
            var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers2, state.options.modifiers)));
            state.orderedModifiers = orderedModifiers.filter(function(m) {
              return m.enabled;
            });
            runModifierEffects();
            return instance.update();
          },
          forceUpdate: function forceUpdate() {
            if (isDestroyed) {
              return;
            }
            var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
            if (!areValidElements(reference3, popper3)) {
              return;
            }
            state.rects = {
              reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
              popper: getLayoutRect(popper3)
            };
            state.reset = false;
            state.placement = state.options.placement;
            state.orderedModifiers.forEach(function(modifier) {
              return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
            });
            for (var index = 0; index < state.orderedModifiers.length; index++) {
              if (state.reset === true) {
                state.reset = false;
                index = -1;
                continue;
              }
              var _state$orderedModifie = state.orderedModifiers[index], fn = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
              if (typeof fn === "function") {
                state = fn({
                  state,
                  options: _options,
                  name,
                  instance
                }) || state;
              }
            }
          },
          update: debounce(function() {
            return new Promise(function(resolve) {
              instance.forceUpdate();
              resolve(state);
            });
          }),
          destroy: function destroy() {
            cleanupModifierEffects();
            isDestroyed = true;
          }
        };
        if (!areValidElements(reference2, popper2)) {
          return instance;
        }
        instance.setOptions(options).then(function(state2) {
          if (!isDestroyed && options.onFirstUpdate) {
            options.onFirstUpdate(state2);
          }
        });
        function runModifierEffects() {
          state.orderedModifiers.forEach(function(_ref3) {
            var name = _ref3.name, _ref3$options = _ref3.options, options2 = _ref3$options === void 0 ? {} : _ref3$options, effect2 = _ref3.effect;
            if (typeof effect2 === "function") {
              var cleanupFn = effect2({
                state,
                name,
                instance,
                options: options2
              });
              var noopFn = function noopFn2() {
              };
              effectCleanupFns.push(cleanupFn || noopFn);
            }
          });
        }
        function cleanupModifierEffects() {
          effectCleanupFns.forEach(function(fn) {
            return fn();
          });
          effectCleanupFns = [];
        }
        return instance;
      };
    }
    var passive = {
      passive: true
    };
    function effect(_ref) {
      var state = _ref.state, instance = _ref.instance, options = _ref.options;
      var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
      var window2 = getWindow(state.elements.popper);
      var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
      if (scroll) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.addEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.addEventListener("resize", instance.update, passive);
      }
      return function() {
        if (scroll) {
          scrollParents.forEach(function(scrollParent) {
            scrollParent.removeEventListener("scroll", instance.update, passive);
          });
        }
        if (resize) {
          window2.removeEventListener("resize", instance.update, passive);
        }
      };
    }
    const eventListeners = {
      name: "eventListeners",
      enabled: true,
      phase: "write",
      fn: function fn() {
      },
      effect,
      data: {}
    };
    function getBasePlacement(placement) {
      return placement.split("-")[0];
    }
    function getVariation(placement) {
      return placement.split("-")[1];
    }
    function getMainAxisFromPlacement(placement) {
      return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
    }
    function computeOffsets(_ref) {
      var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
      var basePlacement = placement ? getBasePlacement(placement) : null;
      var variation = placement ? getVariation(placement) : null;
      var commonX = reference2.x + reference2.width / 2 - element.width / 2;
      var commonY = reference2.y + reference2.height / 2 - element.height / 2;
      var offsets;
      switch (basePlacement) {
        case enums_top:
          offsets = {
            x: commonX,
            y: reference2.y - element.height
          };
          break;
        case bottom:
          offsets = {
            x: commonX,
            y: reference2.y + reference2.height
          };
          break;
        case right:
          offsets = {
            x: reference2.x + reference2.width,
            y: commonY
          };
          break;
        case left:
          offsets = {
            x: reference2.x - element.width,
            y: commonY
          };
          break;
        default:
          offsets = {
            x: reference2.x,
            y: reference2.y
          };
      }
      var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
      if (mainAxis != null) {
        var len = mainAxis === "y" ? "height" : "width";
        switch (variation) {
          case start:
            offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
            break;
          case end:
            offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
            break;
        }
      }
      return offsets;
    }
    function popperOffsets(_ref) {
      var state = _ref.state, name = _ref.name;
      state.modifiersData[name] = computeOffsets({
        reference: state.rects.reference,
        element: state.rects.popper,
        strategy: "absolute",
        placement: state.placement
      });
    }
    const modifiers_popperOffsets = {
      name: "popperOffsets",
      enabled: true,
      phase: "read",
      fn: popperOffsets,
      data: {}
    };
    var unsetSides = {
      top: "auto",
      right: "auto",
      bottom: "auto",
      left: "auto"
    };
    function roundOffsetsByDPR(_ref) {
      var x = _ref.x, y = _ref.y;
      var win = window;
      var dpr = win.devicePixelRatio || 1;
      return {
        x: round(x * dpr) / dpr || 0,
        y: round(y * dpr) / dpr || 0
      };
    }
    function mapToStyles(_ref2) {
      var _Object$assign2;
      var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
      var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
      var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
        x,
        y
      }) : {
        x,
        y
      };
      x = _ref3.x;
      y = _ref3.y;
      var hasX = offsets.hasOwnProperty("x");
      var hasY = offsets.hasOwnProperty("y");
      var sideX = left;
      var sideY = enums_top;
      var win = window;
      if (adaptive) {
        var offsetParent = getOffsetParent(popper2);
        var heightProp = "clientHeight";
        var widthProp = "clientWidth";
        if (offsetParent === getWindow(popper2)) {
          offsetParent = getDocumentElement(popper2);
          if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
            heightProp = "scrollHeight";
            widthProp = "scrollWidth";
          }
        }
        offsetParent = offsetParent;
        if (placement === enums_top || (placement === left || placement === right) && variation === end) {
          sideY = bottom;
          var offsetY = isFixed && win.visualViewport ? win.visualViewport.height : offsetParent[heightProp];
          y -= offsetY - popperRect.height;
          y *= gpuAcceleration ? 1 : -1;
        }
        if (placement === left || (placement === enums_top || placement === bottom) && variation === end) {
          sideX = right;
          var offsetX = isFixed && win.visualViewport ? win.visualViewport.width : offsetParent[widthProp];
          x -= offsetX - popperRect.width;
          x *= gpuAcceleration ? 1 : -1;
        }
      }
      var commonStyles = Object.assign({
        position
      }, adaptive && unsetSides);
      var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
        x,
        y
      }) : {
        x,
        y
      };
      x = _ref4.x;
      y = _ref4.y;
      if (gpuAcceleration) {
        var _Object$assign;
        return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
      }
      return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
    }
    function computeStyles(_ref5) {
      var state = _ref5.state, options = _ref5.options;
      var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
      var commonStyles = {
        placement: getBasePlacement(state.placement),
        variation: getVariation(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration,
        isFixed: state.options.strategy === "fixed"
      };
      if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive,
          roundOffsets
        })));
      }
      if (state.modifiersData.arrow != null) {
        state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.arrow,
          position: "absolute",
          adaptive: false,
          roundOffsets
        })));
      }
      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        "data-popper-placement": state.placement
      });
    }
    const modifiers_computeStyles = {
      name: "computeStyles",
      enabled: true,
      phase: "beforeWrite",
      fn: computeStyles,
      data: {}
    };
    function applyStyles(_ref) {
      var state = _ref.state;
      Object.keys(state.elements).forEach(function(name) {
        var style = state.styles[name] || {};
        var attributes = state.attributes[name] || {};
        var element = state.elements[name];
        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function(name2) {
          var value = attributes[name2];
          if (value === false) {
            element.removeAttribute(name2);
          } else {
            element.setAttribute(name2, value === true ? "" : value);
          }
        });
      });
    }
    function applyStyles_effect(_ref2) {
      var state = _ref2.state;
      var initialStyles = {
        popper: {
          position: state.options.strategy,
          left: "0",
          top: "0",
          margin: "0"
        },
        arrow: {
          position: "absolute"
        },
        reference: {}
      };
      Object.assign(state.elements.popper.style, initialStyles.popper);
      state.styles = initialStyles;
      if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
      }
      return function() {
        Object.keys(state.elements).forEach(function(name) {
          var element = state.elements[name];
          var attributes = state.attributes[name] || {};
          var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
          var style = styleProperties.reduce(function(style2, property) {
            style2[property] = "";
            return style2;
          }, {});
          if (!isHTMLElement(element) || !getNodeName(element)) {
            return;
          }
          Object.assign(element.style, style);
          Object.keys(attributes).forEach(function(attribute) {
            element.removeAttribute(attribute);
          });
        });
      };
    }
    const modifiers_applyStyles = {
      name: "applyStyles",
      enabled: true,
      phase: "write",
      fn: applyStyles,
      effect: applyStyles_effect,
      requires: ["computeStyles"]
    };
    function distanceAndSkiddingToXY(placement, rects, offset2) {
      var basePlacement = getBasePlacement(placement);
      var invertDistance = [left, enums_top].indexOf(basePlacement) >= 0 ? -1 : 1;
      var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
        placement
      })) : offset2, skidding = _ref[0], distance = _ref[1];
      skidding = skidding || 0;
      distance = (distance || 0) * invertDistance;
      return [left, right].indexOf(basePlacement) >= 0 ? {
        x: distance,
        y: skidding
      } : {
        x: skidding,
        y: distance
      };
    }
    function offset(_ref2) {
      var state = _ref2.state, options = _ref2.options, name = _ref2.name;
      var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
      var data = enums_placements.reduce(function(acc, placement) {
        acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
        return acc;
      }, {});
      var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
      if (state.modifiersData.popperOffsets != null) {
        state.modifiersData.popperOffsets.x += x;
        state.modifiersData.popperOffsets.y += y;
      }
      state.modifiersData[name] = data;
    }
    const modifiers_offset = {
      name: "offset",
      enabled: true,
      phase: "main",
      requires: ["popperOffsets"],
      fn: offset
    };
    var hash = {
      left: "right",
      right: "left",
      bottom: "top",
      top: "bottom"
    };
    function getOppositePlacement(placement) {
      return placement.replace(/left|right|bottom|top/g, function(matched) {
        return hash[matched];
      });
    }
    var getOppositeVariationPlacement_hash = {
      start: "end",
      end: "start"
    };
    function getOppositeVariationPlacement(placement) {
      return placement.replace(/start|end/g, function(matched) {
        return getOppositeVariationPlacement_hash[matched];
      });
    }
    function getViewportRect(element) {
      var win = getWindow(element);
      var html = getDocumentElement(element);
      var visualViewport = win.visualViewport;
      var width = html.clientWidth;
      var height = html.clientHeight;
      var x = 0;
      var y = 0;
      if (visualViewport) {
        width = visualViewport.width;
        height = visualViewport.height;
        if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          x = visualViewport.offsetLeft;
          y = visualViewport.offsetTop;
        }
      }
      return {
        width,
        height,
        x: x + getWindowScrollBarX(element),
        y
      };
    }
    function getDocumentRect(element) {
      var _element$ownerDocumen;
      var html = getDocumentElement(element);
      var winScroll = getWindowScroll(element);
      var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
      var width = math_max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
      var height = math_max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
      var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
      var y = -winScroll.scrollTop;
      if (getComputedStyle2(body || html).direction === "rtl") {
        x += math_max(html.clientWidth, body ? body.clientWidth : 0) - width;
      }
      return {
        width,
        height,
        x,
        y
      };
    }
    function contains(parent, child) {
      var rootNode = child.getRootNode && child.getRootNode();
      if (parent.contains(child)) {
        return true;
      } else if (rootNode && isShadowRoot(rootNode)) {
        var next = child;
        do {
          if (next && parent.isSameNode(next)) {
            return true;
          }
          next = next.parentNode || next.host;
        } while (next);
      }
      return false;
    }
    function rectToClientRect(rect) {
      return Object.assign({}, rect, {
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height
      });
    }
    function getInnerBoundingClientRect(element) {
      var rect = getBoundingClientRect(element);
      rect.top = rect.top + element.clientTop;
      rect.left = rect.left + element.clientLeft;
      rect.bottom = rect.top + element.clientHeight;
      rect.right = rect.left + element.clientWidth;
      rect.width = element.clientWidth;
      rect.height = element.clientHeight;
      rect.x = rect.left;
      rect.y = rect.top;
      return rect;
    }
    function getClientRectFromMixedType(element, clippingParent) {
      return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
    }
    function getClippingParents(element) {
      var clippingParents2 = listScrollParents(getParentNode(element));
      var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
      var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
      if (!isElement(clipperElement)) {
        return [];
      }
      return clippingParents2.filter(function(clippingParent) {
        return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
      });
    }
    function getClippingRect(element, boundary, rootBoundary) {
      var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
      var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
      var firstClippingParent = clippingParents2[0];
      var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
        var rect = getClientRectFromMixedType(element, clippingParent);
        accRect.top = math_max(rect.top, accRect.top);
        accRect.right = math_min(rect.right, accRect.right);
        accRect.bottom = math_min(rect.bottom, accRect.bottom);
        accRect.left = math_max(rect.left, accRect.left);
        return accRect;
      }, getClientRectFromMixedType(element, firstClippingParent));
      clippingRect.width = clippingRect.right - clippingRect.left;
      clippingRect.height = clippingRect.bottom - clippingRect.top;
      clippingRect.x = clippingRect.left;
      clippingRect.y = clippingRect.top;
      return clippingRect;
    }
    function getFreshSideObject() {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }
    function mergePaddingObject(paddingObject) {
      return Object.assign({}, getFreshSideObject(), paddingObject);
    }
    function expandToHashMap(value, keys) {
      return keys.reduce(function(hashMap, key) {
        hashMap[key] = value;
        return hashMap;
      }, {});
    }
    function detectOverflow(state, options) {
      if (options === void 0) {
        options = {};
      }
      var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
      var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
      var altContext = elementContext === popper ? reference : popper;
      var popperRect = state.rects.popper;
      var element = state.elements[altBoundary ? altContext : elementContext];
      var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
      var referenceClientRect = getBoundingClientRect(state.elements.reference);
      var popperOffsets2 = computeOffsets({
        reference: referenceClientRect,
        element: popperRect,
        strategy: "absolute",
        placement
      });
      var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
      var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
      var overflowOffsets = {
        top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
        bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
        left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
        right: elementClientRect.right - clippingClientRect.right + paddingObject.right
      };
      var offsetData = state.modifiersData.offset;
      if (elementContext === popper && offsetData) {
        var offset2 = offsetData[placement];
        Object.keys(overflowOffsets).forEach(function(key) {
          var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
          var axis = [enums_top, bottom].indexOf(key) >= 0 ? "y" : "x";
          overflowOffsets[key] += offset2[axis] * multiply;
        });
      }
      return overflowOffsets;
    }
    function computeAutoPlacement(state, options) {
      if (options === void 0) {
        options = {};
      }
      var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? enums_placements : _options$allowedAutoP;
      var variation = getVariation(placement);
      var placements = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
        return getVariation(placement2) === variation;
      }) : basePlacements;
      var allowedPlacements = placements.filter(function(placement2) {
        return allowedAutoPlacements.indexOf(placement2) >= 0;
      });
      if (allowedPlacements.length === 0) {
        allowedPlacements = placements;
      }
      var overflows = allowedPlacements.reduce(function(acc, placement2) {
        acc[placement2] = detectOverflow(state, {
          placement: placement2,
          boundary,
          rootBoundary,
          padding
        })[getBasePlacement(placement2)];
        return acc;
      }, {});
      return Object.keys(overflows).sort(function(a, b) {
        return overflows[a] - overflows[b];
      });
    }
    function getExpandedFallbackPlacements(placement) {
      if (getBasePlacement(placement) === auto) {
        return [];
      }
      var oppositePlacement = getOppositePlacement(placement);
      return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
    }
    function flip(_ref) {
      var state = _ref.state, options = _ref.options, name = _ref.name;
      if (state.modifiersData[name]._skip) {
        return;
      }
      var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
      var preferredPlacement = state.options.placement;
      var basePlacement = getBasePlacement(preferredPlacement);
      var isBasePlacement = basePlacement === preferredPlacement;
      var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
      var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
        return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
          placement: placement2,
          boundary,
          rootBoundary,
          padding,
          flipVariations,
          allowedAutoPlacements
        }) : placement2);
      }, []);
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var checksMap = /* @__PURE__ */ new Map();
      var makeFallbackChecks = true;
      var firstFittingPlacement = placements[0];
      for (var i = 0; i < placements.length; i++) {
        var placement = placements[i];
        var _basePlacement = getBasePlacement(placement);
        var isStartVariation = getVariation(placement) === start;
        var isVertical = [enums_top, bottom].indexOf(_basePlacement) >= 0;
        var len = isVertical ? "width" : "height";
        var overflow = detectOverflow(state, {
          placement,
          boundary,
          rootBoundary,
          altBoundary,
          padding
        });
        var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : enums_top;
        if (referenceRect[len] > popperRect[len]) {
          mainVariationSide = getOppositePlacement(mainVariationSide);
        }
        var altVariationSide = getOppositePlacement(mainVariationSide);
        var checks = [];
        if (checkMainAxis) {
          checks.push(overflow[_basePlacement] <= 0);
        }
        if (checkAltAxis) {
          checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
        }
        if (checks.every(function(check) {
          return check;
        })) {
          firstFittingPlacement = placement;
          makeFallbackChecks = false;
          break;
        }
        checksMap.set(placement, checks);
      }
      if (makeFallbackChecks) {
        var numberOfChecks = flipVariations ? 3 : 1;
        var _loop = function _loop2(_i2) {
          var fittingPlacement = placements.find(function(placement2) {
            var checks2 = checksMap.get(placement2);
            if (checks2) {
              return checks2.slice(0, _i2).every(function(check) {
                return check;
              });
            }
          });
          if (fittingPlacement) {
            firstFittingPlacement = fittingPlacement;
            return "break";
          }
        };
        for (var _i = numberOfChecks; _i > 0; _i--) {
          var _ret = _loop(_i);
          if (_ret === "break")
            break;
        }
      }
      if (state.placement !== firstFittingPlacement) {
        state.modifiersData[name]._skip = true;
        state.placement = firstFittingPlacement;
        state.reset = true;
      }
    }
    const modifiers_flip = {
      name: "flip",
      enabled: true,
      phase: "main",
      fn: flip,
      requiresIfExists: ["offset"],
      data: {
        _skip: false
      }
    };
    function getAltAxis(axis) {
      return axis === "x" ? "y" : "x";
    }
    function within(min, value, max) {
      return math_max(min, math_min(value, max));
    }
    function withinMaxClamp(min, value, max) {
      var v = within(min, value, max);
      return v > max ? max : v;
    }
    function preventOverflow(_ref) {
      var state = _ref.state, options = _ref.options, name = _ref.name;
      var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
      var overflow = detectOverflow(state, {
        boundary,
        rootBoundary,
        padding,
        altBoundary
      });
      var basePlacement = getBasePlacement(state.placement);
      var variation = getVariation(state.placement);
      var isBasePlacement = !variation;
      var mainAxis = getMainAxisFromPlacement(basePlacement);
      var altAxis = getAltAxis(mainAxis);
      var popperOffsets2 = state.modifiersData.popperOffsets;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
        placement: state.placement
      })) : tetherOffset;
      var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
        mainAxis: tetherOffsetValue,
        altAxis: tetherOffsetValue
      } : Object.assign({
        mainAxis: 0,
        altAxis: 0
      }, tetherOffsetValue);
      var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
      var data = {
        x: 0,
        y: 0
      };
      if (!popperOffsets2) {
        return;
      }
      if (checkMainAxis) {
        var _offsetModifierState$;
        var mainSide = mainAxis === "y" ? enums_top : left;
        var altSide = mainAxis === "y" ? bottom : right;
        var len = mainAxis === "y" ? "height" : "width";
        var offset2 = popperOffsets2[mainAxis];
        var min = offset2 + overflow[mainSide];
        var max = offset2 - overflow[altSide];
        var additive = tether ? -popperRect[len] / 2 : 0;
        var minLen = variation === start ? referenceRect[len] : popperRect[len];
        var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
        var arrowElement = state.elements.arrow;
        var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
          width: 0,
          height: 0
        };
        var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
        var arrowPaddingMin = arrowPaddingObject[mainSide];
        var arrowPaddingMax = arrowPaddingObject[altSide];
        var arrowLen = within(0, referenceRect[len], arrowRect[len]);
        var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
        var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
        var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
        var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
        var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
        var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
        var tetherMax = offset2 + maxOffset - offsetModifierValue;
        var preventedOffset = within(tether ? math_min(min, tetherMin) : min, offset2, tether ? math_max(max, tetherMax) : max);
        popperOffsets2[mainAxis] = preventedOffset;
        data[mainAxis] = preventedOffset - offset2;
      }
      if (checkAltAxis) {
        var _offsetModifierState$2;
        var _mainSide = mainAxis === "x" ? enums_top : left;
        var _altSide = mainAxis === "x" ? bottom : right;
        var _offset = popperOffsets2[altAxis];
        var _len = altAxis === "y" ? "height" : "width";
        var _min = _offset + overflow[_mainSide];
        var _max = _offset - overflow[_altSide];
        var isOriginSide = [enums_top, left].indexOf(basePlacement) !== -1;
        var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
        var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
        var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
        var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
        popperOffsets2[altAxis] = _preventedOffset;
        data[altAxis] = _preventedOffset - _offset;
      }
      state.modifiersData[name] = data;
    }
    const modifiers_preventOverflow = {
      name: "preventOverflow",
      enabled: true,
      phase: "main",
      fn: preventOverflow,
      requiresIfExists: ["offset"]
    };
    var toPaddingObject = function toPaddingObject2(padding, state) {
      padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
        placement: state.placement
      })) : padding;
      return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    };
    function arrow(_ref) {
      var _state$modifiersData$;
      var state = _ref.state, name = _ref.name, options = _ref.options;
      var arrowElement = state.elements.arrow;
      var popperOffsets2 = state.modifiersData.popperOffsets;
      var basePlacement = getBasePlacement(state.placement);
      var axis = getMainAxisFromPlacement(basePlacement);
      var isVertical = [left, right].indexOf(basePlacement) >= 0;
      var len = isVertical ? "height" : "width";
      if (!arrowElement || !popperOffsets2) {
        return;
      }
      var paddingObject = toPaddingObject(options.padding, state);
      var arrowRect = getLayoutRect(arrowElement);
      var minProp = axis === "y" ? enums_top : left;
      var maxProp = axis === "y" ? bottom : right;
      var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
      var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
      var arrowOffsetParent = getOffsetParent(arrowElement);
      var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
      var centerToReference = endDiff / 2 - startDiff / 2;
      var min = paddingObject[minProp];
      var max = clientSize - arrowRect[len] - paddingObject[maxProp];
      var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
      var offset2 = within(min, center, max);
      var axisProp = axis;
      state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
    }
    function arrow_effect(_ref2) {
      var state = _ref2.state, options = _ref2.options;
      var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
      if (arrowElement == null) {
        return;
      }
      if (typeof arrowElement === "string") {
        arrowElement = state.elements.popper.querySelector(arrowElement);
        if (!arrowElement) {
          return;
        }
      }
      if (!contains(state.elements.popper, arrowElement)) {
        return;
      }
      state.elements.arrow = arrowElement;
    }
    const modifiers_arrow = {
      name: "arrow",
      enabled: true,
      phase: "main",
      fn: arrow,
      effect: arrow_effect,
      requires: ["popperOffsets"],
      requiresIfExists: ["preventOverflow"]
    };
    function getSideOffsets(overflow, rect, preventedOffsets) {
      if (preventedOffsets === void 0) {
        preventedOffsets = {
          x: 0,
          y: 0
        };
      }
      return {
        top: overflow.top - rect.height - preventedOffsets.y,
        right: overflow.right - rect.width + preventedOffsets.x,
        bottom: overflow.bottom - rect.height + preventedOffsets.y,
        left: overflow.left - rect.width - preventedOffsets.x
      };
    }
    function isAnySideFullyClipped(overflow) {
      return [enums_top, right, bottom, left].some(function(side) {
        return overflow[side] >= 0;
      });
    }
    function hide(_ref) {
      var state = _ref.state, name = _ref.name;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var preventedOffsets = state.modifiersData.preventOverflow;
      var referenceOverflow = detectOverflow(state, {
        elementContext: "reference"
      });
      var popperAltOverflow = detectOverflow(state, {
        altBoundary: true
      });
      var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
      var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
      var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
      var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
      state.modifiersData[name] = {
        referenceClippingOffsets,
        popperEscapeOffsets,
        isReferenceHidden,
        hasPopperEscaped
      };
      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        "data-popper-reference-hidden": isReferenceHidden,
        "data-popper-escaped": hasPopperEscaped
      });
    }
    const modifiers_hide = {
      name: "hide",
      enabled: true,
      phase: "main",
      requiresIfExists: ["preventOverflow"],
      fn: hide
    };
    var defaultModifiers = [eventListeners, modifiers_popperOffsets, modifiers_computeStyles, modifiers_applyStyles, modifiers_offset, modifiers_flip, modifiers_preventOverflow, modifiers_arrow, modifiers_hide];
    var popper_createPopper = /* @__PURE__ */ popperGenerator({
      defaultModifiers
    });
    function dropdown_toConsumableArray(arr) {
      return dropdown_arrayWithoutHoles(arr) || dropdown_iterableToArray(arr) || dropdown_unsupportedIterableToArray(arr) || dropdown_nonIterableSpread();
    }
    function dropdown_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function dropdown_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return dropdown_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return dropdown_arrayLikeToArray(o, minLen);
    }
    function dropdown_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function dropdown_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return dropdown_arrayLikeToArray(arr);
    }
    function dropdown_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function dropdown_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function dropdown_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? dropdown_ownKeys(Object(source), true).forEach(function(key) {
          dropdown_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : dropdown_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function dropdown_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function dropdown_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function dropdown_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function dropdown_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        dropdown_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        dropdown_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var dropdown_Default = {
      placement: "bottom",
      triggerType: "click",
      onShow: function onShow() {
      },
      onHide: function onHide() {
      }
    };
    var Dropdown = /* @__PURE__ */ function() {
      function Dropdown2() {
        var targetElement = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var triggerElement = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        dropdown_classCallCheck(this, Dropdown2);
        this._targetEl = targetElement;
        this._triggerEl = triggerElement;
        this._options = dropdown_objectSpread(dropdown_objectSpread({}, dropdown_Default), options);
        this._popperInstance = this._createPopperInstace();
        this._visible = false;
        this._init();
      }
      dropdown_createClass(Dropdown2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._triggerEl) {
            this._triggerEl.addEventListener("click", function() {
              _this.toggle();
            });
          }
        }
      }, {
        key: "_createPopperInstace",
        value: function _createPopperInstace() {
          return popper_createPopper(this._triggerEl, this._targetEl, {
            placement: this._options.placement,
            modifiers: [{
              name: "offset",
              options: {
                offset: [0, 10]
              }
            }]
          });
        }
      }, {
        key: "_handleClickOutside",
        value: function _handleClickOutside(ev, targetEl) {
          var clickedEl = ev.target;
          if (clickedEl !== targetEl && !targetEl.contains(clickedEl) && !this._triggerEl.contains(clickedEl) && this._visible) {
            this.hide();
          }
          document.body.removeEventListener("click", this._handleClickOutside, true);
        }
      }, {
        key: "toggle",
        value: function toggle() {
          if (this._visible) {
            this.hide();
            document.body.removeEventListener("click", this._handleClickOutside, true);
          } else {
            this.show();
          }
        }
      }, {
        key: "show",
        value: function show() {
          var _this2 = this;
          this._targetEl.classList.remove("hidden");
          this._targetEl.classList.add("block");
          this._popperInstance.setOptions(function(options) {
            return dropdown_objectSpread(dropdown_objectSpread({}, options), {}, {
              modifiers: [].concat(dropdown_toConsumableArray(options.modifiers), [{
                name: "eventListeners",
                enabled: true
              }])
            });
          });
          document.body.addEventListener("click", function(ev) {
            _this2._handleClickOutside(ev, _this2._targetEl);
          }, true);
          this._popperInstance.update();
          this._visible = true;
          this._options.onShow(this);
        }
      }, {
        key: "hide",
        value: function hide2() {
          this._targetEl.classList.remove("block");
          this._targetEl.classList.add("hidden");
          this._popperInstance.setOptions(function(options) {
            return dropdown_objectSpread(dropdown_objectSpread({}, options), {}, {
              modifiers: [].concat(dropdown_toConsumableArray(options.modifiers), [{
                name: "eventListeners",
                enabled: false
              }])
            });
          });
          this._visible = false;
          this._options.onHide(this);
        }
      }]);
      return Dropdown2;
    }();
    window.Dropdown = Dropdown;
    function initDropdown() {
      document.querySelectorAll("[data-dropdown-toggle]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-dropdown-toggle"));
        var placement = triggerEl.getAttribute("data-dropdown-placement");
        new Dropdown(targetEl, triggerEl, {
          placement: placement ? placement : dropdown_Default.placement
        });
      });
    }
    if (document.readyState !== "loading") {
      initDropdown();
    } else {
      document.addEventListener("DOMContentLoaded", initDropdown);
    }
    function modal_toConsumableArray(arr) {
      return modal_arrayWithoutHoles(arr) || modal_iterableToArray(arr) || modal_unsupportedIterableToArray(arr) || modal_nonIterableSpread();
    }
    function modal_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function modal_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return modal_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return modal_arrayLikeToArray(o, minLen);
    }
    function modal_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function modal_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return modal_arrayLikeToArray(arr);
    }
    function modal_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function modal_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function modal_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? modal_ownKeys(Object(source), true).forEach(function(key) {
          modal_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : modal_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function modal_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function modal_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function modal_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function modal_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        modal_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        modal_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var modal_Default = {
      placement: "center",
      backdropClasses: "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40",
      onHide: function onHide() {
      },
      onShow: function onShow() {
      },
      onToggle: function onToggle() {
      }
    };
    var Modal = /* @__PURE__ */ function() {
      function Modal2() {
        var targetEl = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        modal_classCallCheck(this, Modal2);
        this._targetEl = targetEl;
        this._options = modal_objectSpread(modal_objectSpread({}, modal_Default), options);
        this._isHidden = true;
        this._init();
      }
      modal_createClass(Modal2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          this._getPlacementClasses().map(function(c) {
            _this._targetEl.classList.add(c);
          });
        }
      }, {
        key: "_createBackdrop",
        value: function _createBackdrop() {
          if (this._isHidden) {
            var _backdropEl$classList;
            var backdropEl = document.createElement("div");
            backdropEl.setAttribute("modal-backdrop", "");
            (_backdropEl$classList = backdropEl.classList).add.apply(_backdropEl$classList, modal_toConsumableArray(this._options.backdropClasses.split(" ")));
            document.querySelector("body").append(backdropEl);
          }
        }
      }, {
        key: "_destroyBackdropEl",
        value: function _destroyBackdropEl() {
          if (!this._isHidden) {
            document.querySelector("[modal-backdrop]").remove();
          }
        }
      }, {
        key: "_getPlacementClasses",
        value: function _getPlacementClasses() {
          switch (this._options.placement) {
            case "top-left":
              return ["justify-start", "items-start"];
            case "top-center":
              return ["justify-center", "items-start"];
            case "top-right":
              return ["justify-end", "items-start"];
            case "center-left":
              return ["justify-start", "items-center"];
            case "center":
              return ["justify-center", "items-center"];
            case "center-right":
              return ["justify-end", "items-center"];
            case "bottom-left":
              return ["justify-start", "items-end"];
            case "bottom-center":
              return ["justify-center", "items-end"];
            case "bottom-right":
              return ["justify-end", "items-end"];
            default:
              return ["justify-center", "items-center"];
          }
        }
      }, {
        key: "toggle",
        value: function toggle() {
          if (this._isHidden) {
            this.show();
          } else {
            this.hide();
          }
          this._options.onToggle(this);
        }
      }, {
        key: "show",
        value: function show() {
          this._targetEl.classList.add("flex");
          this._targetEl.classList.remove("hidden");
          this._targetEl.setAttribute("aria-modal", "true");
          this._targetEl.setAttribute("role", "dialog");
          this._targetEl.removeAttribute("aria-hidden");
          this._createBackdrop();
          this._isHidden = false;
          this._options.onShow(this);
        }
      }, {
        key: "hide",
        value: function hide2() {
          this._targetEl.classList.add("hidden");
          this._targetEl.classList.remove("flex");
          this._targetEl.setAttribute("aria-hidden", "true");
          this._targetEl.removeAttribute("aria-modal");
          this._targetEl.removeAttribute("role");
          this._destroyBackdropEl();
          this._isHidden = true;
          this._options.onHide(this);
        }
      }]);
      return Modal2;
    }();
    window.Modal = Modal;
    var getModalInstance = function getModalInstance2(id, instances) {
      if (instances.some(function(modalInstance) {
        return modalInstance.id === id;
      })) {
        return instances.find(function(modalInstance) {
          return modalInstance.id === id;
        });
      }
      return false;
    };
    function initModal() {
      var modalInstances = [];
      document.querySelectorAll("[data-modal-toggle]").forEach(function(el) {
        var modalId = el.getAttribute("data-modal-toggle");
        var modalEl = document.getElementById(modalId);
        var placement = modalEl.getAttribute("data-modal-placement");
        if (modalEl) {
          if (!modalEl.hasAttribute("aria-hidden") && !modalEl.hasAttribute("aria-modal")) {
            modalEl.setAttribute("aria-hidden", "true");
          }
        }
        var modal = null;
        if (getModalInstance(modalId, modalInstances)) {
          modal = getModalInstance(modalId, modalInstances);
          modal = modal.object;
        } else {
          modal = new Modal(modalEl, {
            placement: placement ? placement : modal_Default.placement
          });
          modalInstances.push({
            id: modalId,
            object: modal
          });
        }
        if (modalEl.hasAttribute("data-modal-show") && modalEl.getAttribute("data-modal-show") === "true") {
          modal.show();
        }
        el.addEventListener("click", function() {
          modal.toggle();
        });
      });
    }
    if (document.readyState !== "loading") {
      initModal();
    } else {
      document.addEventListener("DOMContentLoaded", initModal);
    }
    function drawer_toConsumableArray(arr) {
      return drawer_arrayWithoutHoles(arr) || drawer_iterableToArray(arr) || drawer_unsupportedIterableToArray(arr) || drawer_nonIterableSpread();
    }
    function drawer_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function drawer_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return drawer_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return drawer_arrayLikeToArray(o, minLen);
    }
    function drawer_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function drawer_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return drawer_arrayLikeToArray(arr);
    }
    function drawer_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function drawer_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function drawer_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? drawer_ownKeys(Object(source), true).forEach(function(key) {
          drawer_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : drawer_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function drawer_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function drawer_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function drawer_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function drawer_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        drawer_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        drawer_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var drawer_Default = {
      placement: "left",
      bodyScrolling: false,
      backdrop: true,
      edge: false,
      edgeOffset: "bottom-[60px]",
      backdropClasses: "bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-30",
      onShow: function onShow() {
      },
      onHide: function onHide() {
      },
      onToggle: function onToggle() {
      }
    };
    var Drawer = /* @__PURE__ */ function() {
      function Drawer2() {
        var targetEl = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var options = arguments.length > 1 ? arguments[1] : void 0;
        drawer_classCallCheck(this, Drawer2);
        this._targetEl = targetEl;
        this._options = drawer_objectSpread(drawer_objectSpread({}, drawer_Default), options);
        this._visible = false;
        this._init();
      }
      drawer_createClass(Drawer2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._targetEl) {
            this._targetEl.setAttribute("aria-hidden", "true");
            this._targetEl.classList.add("transition-transform");
          }
          this._getPlacementClasses(this._options.placement).base.map(function(c) {
            _this._targetEl.classList.add(c);
          });
          this.hide();
        }
      }, {
        key: "isVisible",
        value: function isVisible() {
          return this._visible;
        }
      }, {
        key: "hide",
        value: function hide2() {
          var _this2 = this;
          if (this._options.edge) {
            this._getPlacementClasses(this._options.placement + "-edge").active.map(function(c) {
              _this2._targetEl.classList.remove(c);
            });
            this._getPlacementClasses(this._options.placement + "-edge").inactive.map(function(c) {
              _this2._targetEl.classList.add(c);
            });
          } else {
            this._getPlacementClasses(this._options.placement).active.map(function(c) {
              _this2._targetEl.classList.remove(c);
            });
            this._getPlacementClasses(this._options.placement).inactive.map(function(c) {
              _this2._targetEl.classList.add(c);
            });
          }
          this._targetEl.setAttribute("aria-hidden", "true");
          this._targetEl.removeAttribute("aria-modal");
          this._targetEl.removeAttribute("role");
          if (!this._options.bodyScrolling) {
            document.body.classList.remove("overflow-hidden");
          }
          if (this._options.backdrop) {
            this._destroyBackdropEl();
          }
          this._visible = false;
          this._options.onHide(this);
        }
      }, {
        key: "show",
        value: function show() {
          var _this3 = this;
          if (this._options.edge) {
            this._getPlacementClasses(this._options.placement + "-edge").active.map(function(c) {
              _this3._targetEl.classList.add(c);
            });
            this._getPlacementClasses(this._options.placement + "-edge").inactive.map(function(c) {
              _this3._targetEl.classList.remove(c);
            });
          } else {
            this._getPlacementClasses(this._options.placement).active.map(function(c) {
              _this3._targetEl.classList.add(c);
            });
            this._getPlacementClasses(this._options.placement).inactive.map(function(c) {
              _this3._targetEl.classList.remove(c);
            });
          }
          this._targetEl.setAttribute("aria-modal", "true");
          this._targetEl.setAttribute("role", "dialog");
          this._targetEl.removeAttribute("aria-hidden");
          if (!this._options.bodyScrolling) {
            document.body.classList.add("overflow-hidden");
          }
          if (this._options.backdrop) {
            this._createBackdrop();
          }
          this._visible = true;
          this._options.onShow(this);
        }
      }, {
        key: "toggle",
        value: function toggle() {
          if (this.isVisible()) {
            this.hide();
          } else {
            this.show();
          }
        }
      }, {
        key: "_createBackdrop",
        value: function _createBackdrop() {
          var _this4 = this;
          if (!this._visible) {
            var _backdropEl$classList;
            var backdropEl = document.createElement("div");
            backdropEl.setAttribute("drawer-backdrop", "");
            (_backdropEl$classList = backdropEl.classList).add.apply(_backdropEl$classList, drawer_toConsumableArray(this._options.backdropClasses.split(" ")));
            document.querySelector("body").append(backdropEl);
            backdropEl.addEventListener("click", function() {
              _this4.hide();
            });
          }
        }
      }, {
        key: "_destroyBackdropEl",
        value: function _destroyBackdropEl() {
          if (this._visible) {
            document.querySelector("[drawer-backdrop]").remove();
          }
        }
      }, {
        key: "_getPlacementClasses",
        value: function _getPlacementClasses(placement) {
          switch (placement) {
            case "top":
              return {
                base: ["top-0", "left-0", "right-0"],
                active: ["transform-none"],
                inactive: ["-translate-y-full"]
              };
            case "right":
              return {
                base: ["right-0", "top-0"],
                active: ["transform-none"],
                inactive: ["translate-x-full"]
              };
            case "bottom":
              return {
                base: ["bottom-0", "left-0", "right-0"],
                active: ["transform-none"],
                inactive: ["translate-y-full"]
              };
            case "left":
              return {
                base: ["left-0", "top-0"],
                active: ["transform-none"],
                inactive: ["-translate-x-full"]
              };
            case "bottom-edge":
              return {
                base: ["left-0", "top-0"],
                active: ["transform-none"],
                inactive: ["translate-y-full", this._options.edgeOffset]
              };
            default:
              return {
                base: ["left-0", "top-0"],
                active: ["transform-none"],
                inactive: ["-translate-x-full"]
              };
          }
        }
      }]);
      return Drawer2;
    }();
    window.Drawer = Drawer;
    var getDrawerInstance = function getDrawerInstance2(id, instances) {
      if (instances.some(function(drawerInstance) {
        return drawerInstance.id === id;
      })) {
        return instances.find(function(drawerInstance) {
          return drawerInstance.id === id;
        });
      }
      return false;
    };
    function initDrawer() {
      var drawerInstances = [];
      document.querySelectorAll("[data-drawer-target]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-drawer-target"));
        var drawerId = targetEl.id;
        var placement = triggerEl.getAttribute("data-drawer-placement");
        var bodyScrolling = triggerEl.getAttribute("data-drawer-body-scrolling");
        var backdrop2 = triggerEl.getAttribute("data-drawer-backdrop");
        var edge = triggerEl.getAttribute("data-drawer-edge");
        var edgeOffset = triggerEl.getAttribute("data-drawer-edge-offset");
        var drawer = null;
        if (getDrawerInstance(drawerId, drawerInstances)) {
          drawer = getDrawerInstance(drawerId, drawerInstances);
          drawer = drawer.object;
        } else {
          drawer = new Drawer(targetEl, {
            placement: placement ? placement : drawer_Default.placement,
            bodyScrolling: bodyScrolling ? bodyScrolling === "true" ? true : false : drawer_Default.bodyScrolling,
            backdrop: backdrop2 ? backdrop2 === "true" ? true : false : drawer_Default.backdrop,
            edge: edge ? edge === "true" ? true : false : drawer_Default.edge,
            edgeOffset: edgeOffset ? edgeOffset : drawer_Default.edgeOffset
          });
          drawerInstances.push({
            id: drawerId,
            object: drawer
          });
        }
      });
      document.querySelectorAll("[data-drawer-toggle]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-drawer-toggle"));
        var drawerId = targetEl.id;
        var drawer = getDrawerInstance(drawerId, drawerInstances);
        triggerEl.addEventListener("click", function() {
          if (drawer.object.isVisible()) {
            drawer.object.hide();
          } else {
            drawer.object.show();
          }
        });
      });
      document.querySelectorAll("[data-drawer-dismiss]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-drawer-dismiss"));
        var drawerId = targetEl.id;
        var drawer = getDrawerInstance(drawerId, drawerInstances);
        triggerEl.addEventListener("click", function() {
          drawer.object.hide();
        });
      });
      document.querySelectorAll("[data-drawer-show]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-drawer-show"));
        var drawerId = targetEl.id;
        var drawer = getDrawerInstance(drawerId, drawerInstances);
        triggerEl.addEventListener("click", function() {
          drawer.object.show();
        });
      });
    }
    if (document.readyState !== "loading") {
      initDrawer();
    } else {
      document.addEventListener("DOMContentLoaded", initDrawer);
    }
    function tabs_toConsumableArray(arr) {
      return tabs_arrayWithoutHoles(arr) || tabs_iterableToArray(arr) || tabs_unsupportedIterableToArray(arr) || tabs_nonIterableSpread();
    }
    function tabs_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function tabs_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return tabs_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return tabs_arrayLikeToArray(o, minLen);
    }
    function tabs_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function tabs_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return tabs_arrayLikeToArray(arr);
    }
    function tabs_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function tabs_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function tabs_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? tabs_ownKeys(Object(source), true).forEach(function(key) {
          tabs_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : tabs_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function tabs_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function tabs_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function tabs_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function tabs_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        tabs_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        tabs_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var tabs_Default = {
      defaultTabId: null,
      activeClasses: "text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-500 border-blue-600 dark:border-blue-500",
      inactiveClasses: "dark:border-transparent text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300",
      onShow: function onShow() {
      }
    };
    var Tabs = /* @__PURE__ */ function() {
      function Tabs2() {
        var items = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        tabs_classCallCheck(this, Tabs2);
        this._items = items;
        this._activeTab = options ? this.getTab(options.defaultTabId) : null;
        this._options = tabs_objectSpread(tabs_objectSpread({}, tabs_Default), options);
        this._init();
      }
      tabs_createClass(Tabs2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._items.length) {
            if (!this._activeTab) {
              this._setActiveTab(this._items[0]);
            }
            this.show(this._activeTab.id, true);
            this._items.map(function(tab) {
              tab.triggerEl.addEventListener("click", function() {
                _this.show(tab.id);
              });
            });
          }
        }
      }, {
        key: "getActiveTab",
        value: function getActiveTab() {
          return this._activeTab;
        }
      }, {
        key: "_setActiveTab",
        value: function _setActiveTab(tab) {
          this._activeTab = tab;
        }
      }, {
        key: "getTab",
        value: function getTab(id) {
          return this._items.filter(function(t) {
            return t.id === id;
          })[0];
        }
      }, {
        key: "show",
        value: function show(id) {
          var _this2 = this, _tab$triggerEl$classL, _tab$triggerEl$classL2;
          var forceShow = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
          var tab = this.getTab(id);
          if (tab === this._activeTab && !forceShow) {
            return;
          }
          this._items.map(function(t) {
            if (t !== tab) {
              var _t$triggerEl$classLis, _t$triggerEl$classLis2;
              (_t$triggerEl$classLis = t.triggerEl.classList).remove.apply(_t$triggerEl$classLis, tabs_toConsumableArray(_this2._options.activeClasses.split(" ")));
              (_t$triggerEl$classLis2 = t.triggerEl.classList).add.apply(_t$triggerEl$classLis2, tabs_toConsumableArray(_this2._options.inactiveClasses.split(" ")));
              t.targetEl.classList.add("hidden");
              t.triggerEl.setAttribute("aria-selected", false);
            }
          });
          (_tab$triggerEl$classL = tab.triggerEl.classList).add.apply(_tab$triggerEl$classL, tabs_toConsumableArray(this._options.activeClasses.split(" ")));
          (_tab$triggerEl$classL2 = tab.triggerEl.classList).remove.apply(_tab$triggerEl$classL2, tabs_toConsumableArray(this._options.inactiveClasses.split(" ")));
          tab.triggerEl.setAttribute("aria-selected", true);
          tab.targetEl.classList.remove("hidden");
          this._setActiveTab(tab);
          this._options.onShow(this, tab);
        }
      }]);
      return Tabs2;
    }();
    window.Tabs = Tabs;
    function initTabs() {
      document.querySelectorAll("[data-tabs-toggle]").forEach(function(triggerEl) {
        var tabElements = [];
        var defaultTabId = null;
        triggerEl.querySelectorAll('[role="tab"]').forEach(function(el) {
          var isActive = el.getAttribute("aria-selected") === "true";
          var tab = {
            id: el.getAttribute("data-tabs-target"),
            triggerEl: el,
            targetEl: document.querySelector(el.getAttribute("data-tabs-target"))
          };
          tabElements.push(tab);
          if (isActive) {
            defaultTabId = tab.id;
          }
        });
        new Tabs(tabElements, {
          defaultTabId
        });
      });
    }
    if (document.readyState !== "loading") {
      initTabs();
    } else {
      document.addEventListener("DOMContentLoaded", initTabs);
    }
    function tooltip_toConsumableArray(arr) {
      return tooltip_arrayWithoutHoles(arr) || tooltip_iterableToArray(arr) || tooltip_unsupportedIterableToArray(arr) || tooltip_nonIterableSpread();
    }
    function tooltip_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function tooltip_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return tooltip_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return tooltip_arrayLikeToArray(o, minLen);
    }
    function tooltip_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function tooltip_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return tooltip_arrayLikeToArray(arr);
    }
    function tooltip_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function tooltip_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function tooltip_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? tooltip_ownKeys(Object(source), true).forEach(function(key) {
          tooltip_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : tooltip_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function tooltip_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function tooltip_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function tooltip_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function tooltip_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        tooltip_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        tooltip_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var tooltip_Default = {
      placement: "top",
      triggerType: "hover",
      onShow: function onShow() {
      },
      onHide: function onHide() {
      }
    };
    var Tooltip = /* @__PURE__ */ function() {
      function Tooltip2() {
        var targetEl = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var triggerEl = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        tooltip_classCallCheck(this, Tooltip2);
        this._targetEl = targetEl;
        this._triggerEl = triggerEl;
        this._options = tooltip_objectSpread(tooltip_objectSpread({}, tooltip_Default), options);
        this._popperInstance = this._createPopperInstace();
        this._init();
      }
      tooltip_createClass(Tooltip2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._triggerEl) {
            var triggerEvents = this._getTriggerEvents();
            triggerEvents.showEvents.forEach(function(ev) {
              _this._triggerEl.addEventListener(ev, function() {
                _this.show();
              });
            });
            triggerEvents.hideEvents.forEach(function(ev) {
              _this._triggerEl.addEventListener(ev, function() {
                _this.hide();
              });
            });
          }
        }
      }, {
        key: "_createPopperInstace",
        value: function _createPopperInstace() {
          return popper_createPopper(this._triggerEl, this._targetEl, {
            placement: this._options.placement,
            modifiers: [{
              name: "offset",
              options: {
                offset: [0, 8]
              }
            }]
          });
        }
      }, {
        key: "_getTriggerEvents",
        value: function _getTriggerEvents() {
          switch (this._options.triggerType) {
            case "hover":
              return {
                showEvents: ["mouseenter", "focus"],
                hideEvents: ["mouseleave", "blur"]
              };
            case "click":
              return {
                showEvents: ["click", "focus"],
                hideEvents: ["focusout", "blur"]
              };
            default:
              return {
                showEvents: ["mouseenter", "focus"],
                hideEvents: ["mouseleave", "blur"]
              };
          }
        }
      }, {
        key: "show",
        value: function show() {
          this._targetEl.classList.remove("opacity-0", "invisible");
          this._targetEl.classList.add("opacity-100", "visible");
          this._popperInstance.setOptions(function(options) {
            return tooltip_objectSpread(tooltip_objectSpread({}, options), {}, {
              modifiers: [].concat(tooltip_toConsumableArray(options.modifiers), [{
                name: "eventListeners",
                enabled: true
              }])
            });
          });
          this._popperInstance.update();
          this._options.onShow(this);
        }
      }, {
        key: "hide",
        value: function hide2() {
          this._targetEl.classList.remove("opacity-100", "visible");
          this._targetEl.classList.add("opacity-0", "invisible");
          this._popperInstance.setOptions(function(options) {
            return tooltip_objectSpread(tooltip_objectSpread({}, options), {}, {
              modifiers: [].concat(tooltip_toConsumableArray(options.modifiers), [{
                name: "eventListeners",
                enabled: false
              }])
            });
          });
          this._options.onHide(this);
        }
      }]);
      return Tooltip2;
    }();
    window.Tooltip = Tooltip;
    function initTooltip() {
      document.querySelectorAll("[data-tooltip-target]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-tooltip-target"));
        var triggerType = triggerEl.getAttribute("data-tooltip-trigger");
        var placement = triggerEl.getAttribute("data-tooltip-placement");
        new Tooltip(targetEl, triggerEl, {
          placement: placement ? placement : tooltip_Default.placement,
          triggerType: triggerType ? triggerType : tooltip_Default.triggerType
        });
      });
    }
    if (document.readyState !== "loading") {
      initTooltip();
    } else {
      document.addEventListener("DOMContentLoaded", initTooltip);
    }
    function popover_toConsumableArray(arr) {
      return popover_arrayWithoutHoles(arr) || popover_iterableToArray(arr) || popover_unsupportedIterableToArray(arr) || popover_nonIterableSpread();
    }
    function popover_nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function popover_unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return popover_arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return popover_arrayLikeToArray(o, minLen);
    }
    function popover_iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
        return Array.from(iter);
    }
    function popover_arrayWithoutHoles(arr) {
      if (Array.isArray(arr))
        return popover_arrayLikeToArray(arr);
    }
    function popover_arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function popover_ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function popover_objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? popover_ownKeys(Object(source), true).forEach(function(key) {
          popover_defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : popover_ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function popover_defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function popover_classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function popover_defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function popover_createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        popover_defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        popover_defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    var popover_Default = {
      placement: "top",
      offset: 10,
      triggerType: "hover",
      onShow: function onShow() {
      },
      onHide: function onHide() {
      }
    };
    var Popover = /* @__PURE__ */ function() {
      function Popover2() {
        var targetEl = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var triggerEl = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        popover_classCallCheck(this, Popover2);
        this._targetEl = targetEl;
        this._triggerEl = triggerEl;
        this._options = popover_objectSpread(popover_objectSpread({}, popover_Default), options);
        this._popperInstance = this._createPopperInstace();
        this._init();
      }
      popover_createClass(Popover2, [{
        key: "_init",
        value: function _init() {
          var _this = this;
          if (this._triggerEl) {
            var triggerEvents = this._getTriggerEvents();
            triggerEvents.showEvents.forEach(function(ev) {
              _this._triggerEl.addEventListener(ev, function() {
                _this.show();
              });
              _this._targetEl.addEventListener(ev, function() {
                _this.show();
              });
            });
            triggerEvents.hideEvents.forEach(function(ev) {
              _this._triggerEl.addEventListener(ev, function() {
                setTimeout(function() {
                  if (!_this._targetEl.matches(":hover")) {
                    _this.hide();
                  }
                }, 100);
              });
              _this._targetEl.addEventListener(ev, function() {
                setTimeout(function() {
                  if (!_this._triggerEl.matches(":hover")) {
                    _this.hide();
                  }
                }, 100);
              });
            });
          }
        }
      }, {
        key: "_createPopperInstace",
        value: function _createPopperInstace() {
          return popper_createPopper(this._triggerEl, this._targetEl, {
            placement: this._options.placement,
            modifiers: [{
              name: "offset",
              options: {
                offset: [0, this._options.offset]
              }
            }]
          });
        }
      }, {
        key: "_getTriggerEvents",
        value: function _getTriggerEvents() {
          switch (this._options.triggerType) {
            case "hover":
              return {
                showEvents: ["mouseenter", "focus"],
                hideEvents: ["mouseleave", "blur"]
              };
            case "click":
              return {
                showEvents: ["click", "focus"],
                hideEvents: ["focusout", "blur"]
              };
            default:
              return {
                showEvents: ["mouseenter", "focus"],
                hideEvents: ["mouseleave", "blur"]
              };
          }
        }
      }, {
        key: "show",
        value: function show() {
          this._targetEl.classList.remove("opacity-0", "invisible");
          this._targetEl.classList.add("opacity-100", "visible");
          this._popperInstance.setOptions(function(options) {
            return popover_objectSpread(popover_objectSpread({}, options), {}, {
              modifiers: [].concat(popover_toConsumableArray(options.modifiers), [{
                name: "eventListeners",
                enabled: true
              }])
            });
          });
          this._popperInstance.update();
          this._options.onShow(this);
        }
      }, {
        key: "hide",
        value: function hide2() {
          this._targetEl.classList.remove("opacity-100", "visible");
          this._targetEl.classList.add("opacity-0", "invisible");
          this._popperInstance.setOptions(function(options) {
            return popover_objectSpread(popover_objectSpread({}, options), {}, {
              modifiers: [].concat(popover_toConsumableArray(options.modifiers), [{
                name: "eventListeners",
                enabled: false
              }])
            });
          });
          this._options.onHide(this);
        }
      }]);
      return Popover2;
    }();
    window.Popover = Popover;
    function initPopover() {
      document.querySelectorAll("[data-popover-target]").forEach(function(triggerEl) {
        var targetEl = document.getElementById(triggerEl.getAttribute("data-popover-target"));
        var triggerType = triggerEl.getAttribute("data-popover-trigger");
        var placement = triggerEl.getAttribute("data-popover-placement");
        var offset2 = triggerEl.getAttribute("data-popover-offset");
        new Popover(targetEl, triggerEl, {
          placement: placement ? placement : popover_Default.placement,
          offset: offset2 ? parseInt(offset2) : popover_Default.offset,
          triggerType: triggerType ? triggerType : popover_Default.triggerType
        });
      });
    }
    if (document.readyState !== "loading") {
      initPopover();
    } else {
      document.addEventListener("DOMContentLoaded", initPopover);
    }
  })();
  document.addEventListener("DOMContentLoaded", function() {
    new Rellax(".rellax");
    var homeSection = $("#banner"), navbar = $("nav"), navChange = false, navHeight = navbar.height();
    $(window).scroll(function() {
      effectsHomeSection(homeSection, this);
    });
    function effectsHomeSection(homeSection2, scrollTopp) {
      if (homeSection2.length > 0) {
        let homeSHeight = homeSection2.height();
        if (homeSHeight - navHeight <= $(scrollTopp).scrollTop()) {
          if (!navChange) {
            navbar.addClass("bg-brand");
            navChange = true;
          }
        } else {
          if (navChange) {
            navbar.removeClass("bg-brand");
            navChange = false;
          }
        }
      }
    }
    var tl = anime.timeline({
      easing: "easeOutExpo"
    });
    tl.add({
      targets: "#izq",
      translateX: ["-200%", 0],
      duration: 4e3
    });
    tl.add(
      {
        targets: "#der",
        translateX: ["200%", 0],
        duration: 4e3
      },
      "-=4000"
    );
    var urlService;
    const targetModal = document.getElementById("modal-services");
    services.addEventListener("click", (e) => {
      if (e.target.closest(".card-objetivo")) {
        let servicio = e.target.parentNode.parentNode.parentNode;
        let title = servicio.getElementsByTagName("h2")[0].innerText;
        let modalTitle = targetModal.getElementsByTagName("h3");
        modalTitle[0].innerHTML = title;
        let subtitle = servicio.getElementsByTagName("h4")[0].innerText;
        let modalSubtitle = targetModal.getElementsByTagName("h4");
        modalSubtitle[0].innerHTML = subtitle;
        let content = servicio.getElementsByClassName("service-content")[0].innerText;
        let modalContent = targetModal.getElementsByTagName("p");
        modalContent[0].innerHTML = content;
        urlService = servicio.getElementsByClassName("urlService")[0].innerText;
        targetModal.classList.toggle("hidden");
        backdrop.classList.toggle("hidden");
      }
    });
    let btnClose = document.getElementById("modal-btn");
    btnClose.addEventListener("click", (e) => {
      targetModal.classList.toggle("hidden");
      backdrop.classList.toggle("hidden");
    });
    let readMore = document.getElementById("readMore-btn");
    readMore.addEventListener("click", (e) => {
      window.location = urlService;
    });
  });
})();
