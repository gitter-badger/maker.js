/// <reference path="../../typings/tsd.d.ts" />

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved. 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0  
 
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, 
MERCHANTABLITY OR NON-INFRINGEMENT. 
 
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

//https://github.com/Microsoft/maker.js

/**
 * Root module for Maker.js.
 * 
 * Example: get a reference to Maker.js
 * ```
 * var makerjs = require('makerjs');
 * ```
 * 
 */
module MakerJs {

    //units

    /**
     * String-based enumeration of unit types: imperial, metric or otherwise. 
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units. 
     * Unit conversion function is makerjs.units.conversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    export var unitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };

    /**
     * Numeric rounding
     * 
     * Example: round to 3 decimal places
     * ```
     * makerjs.round(3.14159, .001); //returns 3.142
     * ```
     * 
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     */
    export function round(n: number, accuracy = .0000001) {
        var places = 1 / accuracy;
        return Math.round(n * places) / places;
    }

    /**
     * Copy the properties from one object to another object.
     * 
     * Example:
     * ```
     * makerjs.extendObject({ abc: 123 }, { xyz: 789 }); //returns { abc: 123, xyz: 789 }
     * ```
     * 
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    export function extendObject(target: Object, other: Object) {
        if (target && other) {
            for (var key in other) {
                if (typeof other[key] !== 'undefined') {
                    target[key] = other[key];
                }
            }
        }
        return target;
    }

    /**
     * Things that may have an id.
     * @private
     */
    export interface IHaveId {
        id: string;
    }

    /**
     * An item found in an array.
     * @private
     */
    export interface IFound<T> {

        /**
         * Position of the item within the array.
         */

        index: number;
        /**
         * The found item.
         */
        item: T;
    }

    /**
     * Search within an array to find an item by its id property.
     * 
     * Examples: find a path with id of 'abc'
     * ```
     * var found: IFound<IPath> = findById<IPath>(someModel.paths, 'abc');   //typescript
     * var found = findById(someModel.paths, 'abc');   //javascript
     * ```
     * 
     * @param arr Array to search.
     * @param id Id of the item to find.
     * @returns object with item and its position.
     */
    export function findById<T extends IHaveId>(arr: T[], id: string): IFound<T> {
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                if (item.id == id) {
                    return {
                        index: i,
                        item: item
                    };
                }
            }
        }
        return null;
    }

    /**
     * Search within an array to find an item by its id property, then remove it from the array.
     * 
     * Examples: remove a model with id of 'xyz'
     * ```
     * removeById<IModel>(someModel.models, 'xyz');   //typescript
     * removeById(someModel.models, 'xyz');   //javascript
     * ```
     * 
     * @param arr Array to search.
     * @param id Id of the item to find and remove.
     */
    export function removeById<T extends IHaveId>(arr: T[], id: string): void {
        var found = findById<T>(arr, id);
        if (found) {
            arr.splice(found.index, 1);
        }
    }

    //points

    /**
     * An x-y point in a two-dimensional space.
     * Implemented as an array with 2 elements. The first element is x, the second element is y.
     * 
     * Examples:
     * ```
     * var p: IPoint = [0, 0];   //typescript
     * var p = [0, 0];   //javascript
     * ```
     */
    export interface IPoint {
        [index: number]: number;
    }

    /**
     * Test to see if an object implements the required properties of a point.
     * 
     * @param item The item to test.
     */
    export function isPoint(item: any) {
        return (Array.isArray(item) && item.length > 1);
    }

    /**
     * A measurement of extents, the high and low points.
     */
    export interface IMeasure {

        /**
         * The point containing both the lowest x and y values of the rectangle containing the item being measured.
         */
        low: IPoint;
        
        /**
         * The point containing both the highest x and y values of the rectangle containing the item being measured.
         */
        high: IPoint;
    }

    //paths

    /**
     * A line, curved line or other simple two dimensional shape.
     */
    export interface IPath extends IHaveId {
        
        /**
         * The type of the path, e.g. "line", "circle", or "arc". These strings are enumerated in pathType.
         */
        type: string;
        
        /**
         * The main point of reference for this path.
         */
        origin: IPoint;

        /**
         * Optional CSS style properties to be emitted into SVG. Useful for creating guidelines and debugging your model.
         */
        cssStyle?: string;
    }

    /**
     * Test to see if an object implements the required properties of a path.
     * 
     * @param item The item to test.
     */
    export function isPath(item: any): boolean {
        return item && item.type && item.origin;
    }

    /**
     * A line path.
     * 
     * Examples:
     * ```
     * var line: IPathLine = { type: 'line', id: 'myline', origin: [0, 0], end: [1, 1] };   //typescript
     * var line = { type: 'line', id: 'myline', origin: [0, 0], end: [1, 1] };   //javascript
     * ```
     */
    export interface IPathLine extends IPath {
        
        /**
         * The end point defining the line. The start point is the origin.
         */
        end: IPoint;
    }

    /**
     * A circle path.
     * 
     * Examples:
     * ```
     * var circle: IPathCircle = { type: 'circle', id: 'mycircle', origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: 'circle', id: 'mycircle', origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    export interface IPathCircle extends IPath {
        
        /**
         * The radius of the circle.
         */
        radius: number;
    }

    /**
     * An arc path.
     * 
     * Examples:
     * ```
     * var arc: IPathArc = { type: 'arc', id: 'myarc', origin: [0, 0], radius: 7, startAngle: 0, endAngle: 45 };   //typescript
     * var arc = { type: 'arc', id: 'myarc', origin: [0, 0], radius: 7, startAngle: 0, endAngle: 45 };   //javascript
     * ```
     */
    export interface IPathArc extends IPathCircle {

        /**
         * The angle (in degrees) to begin drawing the arc, in polar (counter-clockwise) direction.
         */
        startAngle: number;

        /**
         * The angle (in degrees) to end drawing the arc, in polar (counter-clockwise) direction. May be less than start angle if it past 360.
         */
        endAngle: number;
    }

    /**
     * A map of functions which accept a path as a parameter.
     * @private
     */
    export interface IPathFunctionMap {
        
        /**
         * Key is the type of a path, value is a function which accepts a path object as its parameter.
         */
        [type: string]: (pathValue: IPath) => void;
    }

    /**
     * A map of functions which accept a path and an origin point as parameters.
     * @private
     */
    export interface IPathOriginFunctionMap {
        
        /**
         * Key is the type of a path, value is a function which accepts a path object a point object as its parameters.
         */
        [type: string]: (pathValue: IPath, origin: IPoint) => void;
    }

    /**
     * String-based enumeration of all paths types.
     * 
     * Examples: use pathType instead of string literal when creating a circle.
     * ```
     * var circle: IPathCircle = { type: pathType.Circle, id: 'mycircle', origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: pathType.Circle, id: 'mycircle', origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    export var pathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc"
    };

    //models

    /**
     * A model is a composite object which may contain an array of paths, or an array of models recursively.
     * 
     * Example:
     * ```
     * var m = { id: 'mymodel', 
     *   paths: [ 
     *     { type: 'line', id: 'l1', origin: [0, 0], end: [1, 1] }, 
     *     { type: 'line', id: 'l2', origin: [0, 0], end: [-1, -1] } 
     *   ] };
     * ```
     */
    export interface IModel extends IHaveId {
        
        /**
         * Optional origin location of this model.
         */
        origin?: IPoint;

        /**
         * A model may want to specify its type, but this value is not employed yet.
         */
        type?: string;
        
        /**
         * Optional array of path objects in this model.
         */
        paths?: IPath[];
        
        /**
         * Optional array of models within this model.
         */
        models?: IModel[];
        
        /**
         * Optional unit system of this model. See UnitType for possible values.
         */
        units?: string;

        /**
         * An author may wish to add notes to this model instance.
         */
        notes?: string;
    }

    /**
     * Test to see if an object implements the required properties of a model.
     */
    export function isModel(item: any): boolean {
        return item && (item.paths || item.models);
    }

}

//CommonJs
module.exports = MakerJs;
