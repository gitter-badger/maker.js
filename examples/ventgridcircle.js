require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
///<reference path="../target/ts/makerjs.d.ts"/>
var makerjs = (typeof window !== "undefined" ? window.makerjs : typeof global !== "undefined" ? global.makerjs : null);
var Ventgrid = (function () {
    function Ventgrid(filterRadius, spacing, width, height) {
        var _this = this;
        this.filterRadius = filterRadius;
        this.spacing = spacing;
        this.width = width;
        this.height = height;
        this.id = 'ventgridInstance';
        this.units = makerjs.unitType.Millimeter;
        this.paths = [];
        var alternate = false;
        var xDistance = 2 * filterRadius * (1 + spacing / 100);
        var countX = Math.ceil(width / xDistance);
        var yDistance = makerjs.tools.solveTriangleASA(60, xDistance / 2, 90);
        var countY = Math.ceil(height / yDistance) + 1;
        function checkBoundary(x, y) {
            return y - filterRadius < height && x - filterRadius < width;
        }
        var row = function (iy) {
            var total = countX;
            if (!alternate) {
                total++;
            }
            for (var i = 0; i < total; i++) {
                var x = i * xDistance;
                var y = iy * yDistance;
                if (alternate) {
                    x += xDistance / 2;
                }
                if (checkBoundary(Math.abs(x), Math.abs(y))) {
                    _this.paths.push(new makerjs.paths.Circle('filter', [x, y], filterRadius));
                    if (alternate || (!alternate && i > 0)) {
                        _this.paths.push(new makerjs.paths.Circle('filter', [-x, y], filterRadius));
                    }
                }
            }
        };
        for (var i = 0; i < countY; i++) {
            row(i);
            if (i > 0) {
                row(-i);
            }
            alternate = !alternate;
        }
    }
    return Ventgrid;
})();
Ventgrid.metaParameters = [
    { title: "filterRadius", type: "range", min: 1, max: 20, value: 2 },
    { title: "spacing", type: "range", min: 10, max: 100, value: 49 },
    { title: "width", type: "range", min: 20, max: 200, value: 37 },
    { title: "height", type: "range", min: 20, max: 200, value: 50 },
];
module.exports = Ventgrid;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"ventgridcircle":[function(require,module,exports){
(function (global){
///<reference path="../target/ts/makerjs.d.ts"/>
///<reference path="ventgrid.d.ts"/>
var makerjs = (typeof window !== "undefined" ? window.makerjs : typeof global !== "undefined" ? global.makerjs : null);
var ventgrid = require('./ventgrid.js');
var VentgridCircle = (function () {
    function VentgridCircle(filterRadius, spacing, radius) {
        this.filterRadius = filterRadius;
        this.spacing = spacing;
        this.radius = radius;
        this.id = 'ventgridcircleInstance';
        this.units = makerjs.unitType.Millimeter;
        this.paths = [];
        this.rim = new makerjs.paths.Circle('container', [0, 0], radius);
        var ventgridInstance = new ventgrid(filterRadius, spacing, radius, radius);
        for (var i = 0; i < ventgridInstance.paths.length; i++) {
            var circle = ventgridInstance.paths[i];
            this.checkCircle(circle);
        }
    }
    VentgridCircle.prototype.checkCircle = function (circle) {
        var distanceToCenter = makerjs.measure.pointDistance([0, 0], circle.origin);
        if (makerjs.round(distanceToCenter + circle.radius) <= this.radius) {
            //inside
            this.paths.push(circle);
        }
        else if (makerjs.round(distanceToCenter - circle.radius) > this.radius) {
        }
        else {
            //border
            var arcIntersection = makerjs.tools.pathIntersection(circle, this.rim);
            if (arcIntersection && arcIntersection.path1Angles.length == 2) {
                var filterArc = new makerjs.paths.Arc('filterArc', circle.origin, circle.radius, arcIntersection.path1Angles[1], arcIntersection.path1Angles[0]);
                this.paths.push(filterArc);
                var rimArc = new makerjs.paths.Arc('filterArcRim', [0, 0], this.radius, arcIntersection.path2Angles[0], arcIntersection.path2Angles[1]);
                this.paths.push(rimArc);
            }
        }
    };
    return VentgridCircle;
})();
VentgridCircle.metaParameters = [
    { title: "filterRadius", type: "range", min: 1, max: 20, value: 6 },
    { title: "spacing", type: "range", min: 10, max: 100, value: 30 },
    { title: "radius", type: "range", min: 20, max: 200, value: 100 }
];
module.exports = VentgridCircle;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ventgrid.js":1}]},{},[]);
