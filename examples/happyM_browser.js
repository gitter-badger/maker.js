require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var makerjs = (window.makerjs);

function M(height, columnSpace, columnWidth, dropHigh, dropLow, dropConnect, innerSerifWidth, serifWidth, serifHeight) {

    var columnRef = serifWidth + columnWidth;
    var halfColumnSpace = columnSpace / 2;
    var center = columnRef + halfColumnSpace;
    var serifH = Math.min(height / 2, serifHeight);

    var points = [];

    points.push([center, height * dropHigh]);
    points.push([columnRef, height]);
    points.push([0, height]);
    points.push([0, height - serifH]);
    points.push([serifWidth, height - serifH]);
    points.push([serifWidth, serifH]);
    points.push([0, serifH]);
    points.push([0, 0]);
    points.push([columnRef + halfColumnSpace * innerSerifWidth, 0]);
    points.push([columnRef + halfColumnSpace * innerSerifWidth, serifH]);
    points.push([columnRef, serifH]);
    points.push([columnRef, serifH + (height - serifH) * dropConnect]);
    points.push([center, height * dropLow]);

    var halfModel = new makerjs.models.ConnectTheDots('halfModel', false, points);
    var otherHalf = makerjs.model.move(makerjs.model.mirror(halfModel, true, false), [center * 2, 0])

    this.id = 'M';
    this.units = makerjs.unitType.Inch;
    this.models = [halfModel, otherHalf];
}

M.metaParameters = [
    { title: "height", type: "range", min: .2, max: 6, step: .1, value: 1.5 },
    { title: "columnSpace", type: "range", min: .01, max: 4, step: .1, value: .7 },
    { title: "columnWidth", type: "range", min: .01, max: 2, step: .01, value: 0.46 },
    { title: "dropHigh", type: "range", min: 0, max: 1, step: .01, value: 0.65 },
    { title: "dropLow", type: "range", min: 0, max: 1, step: .01, value: 0.3 },
    { title: "dropConnect", type: "range", min: 0, max: 1, step: .01, value: 0.65 },
    { title: "innerSerifWidth", type: "range", min: 0, max: 1, step: .01, value: .5 },
    { title: "serifWidth", type: "range", min: 0, max: 1, step: .01, value: 0.2 },
    { title: "serifHeight", type: "range", min: 0, max: 2, step: .01, value: 0.2 },
];

module.exports = M;

},{}],2:[function(require,module,exports){
var makerjs = (window.makerjs);

function smile(span, teeth, droop, dainty, gaze, heady) {

    this.id = "smile";

    this.origin = [3, 3];

    this.paths = [
        new makerjs.paths.Circle('head', [0, 0], 2.7),
        new makerjs.paths.Circle('rightEye', [1, heady], gaze),
        new makerjs.paths.Circle('leftEye', [-1, heady], gaze)
    ];

    var mouth = new makerjs.models.OvalArc('mouth', 270 - span, 270 + span, dainty, teeth);
    
    mouth.origin = [0, droop];

    this.models = [
        mouth
    ];
}

smile.metaParameters = [
    { title: "smile span", type: "range", min: 0, max: 90, value: 45 },
    { title: "toothiness", type: "range", min: 0, max: 1, step: 0.05, value: .3 },
    { title: "droopiness", type: "range", min: -1, max: 2, step: 0.1, value: .8 },
    { title: "daintyness", type: "range", min: 0.2, max: 3, step: .1, value: 2 },
    { title: "gazyness", type: "range", min: 0.05, max: 1, step: .05, value: .4 },
    { title: "headyness", type: "range", min: 0.05, max: 2, step: .05, value: .8 }
];

module.exports = smile;

},{}],"happyM_browser":[function(require,module,exports){
var makerjs = (window.makerjs);
var smile = require('./smile.js');
var m = require('./m.js');

function happyM_browser(span, teeth, droop, dainty, gaze, heady, height, columnSpace, columnWidth, dropHigh, dropLow, dropConnect, innerSerifWidth, serifWidth, serifHeight) {

    this.id = 'happyM';

    var m1 = makerjs.model.flatten(new m(height, columnSpace, columnWidth, dropHigh, dropLow, dropConnect, innerSerifWidth, serifWidth, serifHeight));

    function smallSmile(origin) {
        var smile1 = makerjs.model.scale(new smile(span, teeth, droop, dainty, gaze, heady), .025);

        this.origin = origin;

        //assume the content of smile1
        this.paths = smile1.paths;
        this.models = smile1.models;
    }

    this.paths = [];
    this.models = [];

    var points = [];
    
    function getPointsFwd(model) {

        //don't get the first item, start at 1 instead of zero
        for (var i = 1; i < model.paths.length; i++) {
            points.push(model.paths[i].origin);
        }
        points.push(model.paths[i - 1].end);
    }

    function getPointsRev(model) {
        for (var i = model.paths.length - 1; i >= 0; i--) {
            points.push(model.paths[i].origin);
        }
    }

    getPointsFwd(m1.models[0]);
    getPointsRev(m1.models[1]);

    var paths = this.paths;
    var models = this.models;

    function gapCircle(aSmile, line) {
        var id = 'head';
        var found = makerjs.findById(aSmile.paths, id);
        if (!found) {
            id = 'head_1';
            found = makerjs.findById(aSmile.paths, id);
        }
        if (found) {
            var head = found.item;
            var pct = .5;
            var intersection = makerjs.tools.pathIntersection(head, line);
            if (intersection) {
                
                switch (head.type) {
                    case 'arc':
                        pct = (intersection.path1Angles[0] - head.startAngle) / makerjs.measure.arcAngle(head);
                        break;
                    case 'circle':
                        pct = intersection.path1Angles[0] / 360;
                        break;
                }
            }
            return makerjs.tools.gapPath(aSmile, id, .025, pct);
        }
    }

    function connectSmile(smileA, smileB) {
        var line = new makerjs.paths.Line('guide', smileA.point, smileB.point);
        var gapA = gapCircle(smileA.smile, line);
        var gapB = gapCircle(smileB.smile, line);
        if (gapA && gapB && gapA.length == 2 && gapB.length == 2) {
            var bridgeGaps = makerjs.tools.bridgeGaps(gapA, gapB);
            paths.push(bridgeGaps[0]);
            paths.push(bridgeGaps[1]);
        }
    }

    function addSmile(i) {
        var thiz = { 
            smile: makerjs.model.flatten(new smallSmile(points[i])),
            point: points[i] 
        };

        models.push(thiz.smile);

        if (prev) {
            connectSmile(prev, thiz);
        }

        prev = thiz;
        return thiz;
    }

    var prev;
    var first = addSmile(0);
    var last;

    for (var i = 1; i < points.length; i++) {
        last = addSmile(i);
    }

    connectSmile(last, first);

    this.units = makerjs.unitType.Inch;
}

happyM_browser.metaParameters = smile.metaParameters.concat(m.metaParameters);

module.exports = happyM_browser;

console.log('happyM_browser is running!');

/*to make this run in the browser, use this command line (from the root of your git):
browserify -r ./examples/happyM.js:happyM_browser > ./examples/happyM_browser.js
*/
},{"./m.js":1,"./smile.js":2}]},{},[]);
