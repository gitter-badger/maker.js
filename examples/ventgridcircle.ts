///<reference path="../target/ts/makerjs.d.ts"/>
///<reference path="ventgrid.d.ts"/>

var makerjs: typeof MakerJs = require('../target/js/node.maker.js');
var ventgrid: typeof Ventgrid = require('./ventgrid.js');

class VentgridCircle implements MakerJs.IModel {
		
    public id = 'ventgridcircleInstance';
	public units = makerjs.unitType.Millimeter;
	public paths: MakerJs.IPath[] = [];
	private rim: MakerJs.IPathCircle;
	
	constructor(public filterRadius: number, public spacing: number, public radius: number) {
		
		this.rim = new makerjs.paths.Circle('container', [0,0], radius);
		
		var ventgridInstance = new ventgrid(filterRadius, spacing, radius, radius);
		
		for (var i=0; i < ventgridInstance.paths.length; i++) {
			var circle = <MakerJs.IPathCircle>ventgridInstance.paths[i];
			this.checkCircle(circle);
		}		
			
	}
	
	private checkCircle (circle: MakerJs.IPathCircle) {
		var distanceToCenter = makerjs.measure.pointDistance([0,0], circle.origin);
		
		if (makerjs.round(distanceToCenter + circle.radius) <= this.radius) {
			//inside
			this.paths.push(circle);
			
		} else if (makerjs.round(distanceToCenter - circle.radius) > this.radius) {
			//outside, don't add
			
		} else {
			//border
			var arcIntersection = makerjs.tools.pathIntersection(circle, this.rim);
			
			if (arcIntersection && arcIntersection.path1Angles.length == 2) {
				var filterArc = new makerjs.paths.Arc('filterArc', circle.origin, circle.radius, arcIntersection.path1Angles[1], arcIntersection.path1Angles[0]);
				this.paths.push(filterArc);
				
				var rimArc = new makerjs.paths.Arc('filterArcRim', [0,0], this.radius, arcIntersection.path2Angles[0], arcIntersection.path2Angles[1]);
				this.paths.push(rimArc);
			}
		}
	}
	
}

(<MakerJs.kit.IModelConstructor>VentgridCircle).metaParameters = [
    { title: "filterRadius", type: "range", min: 1, max: 20, value: 6 },
	{ title: "spacing", type: "range", min: 10, max: 100, value: 30 },
	{ title: "radius", type: "range", min: 20, max: 200, value: 100 }
];

module.exports = VentgridCircle;

/*
 * To compile this: go to the root and:
 
    cd examples
    tsc ventgridcircle.ts
    cp ventgridcircle.js temp.js  
    browserify -r ./temp.js:ventgridcircle > ventgridcircle.js

 */