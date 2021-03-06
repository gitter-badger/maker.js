/// <reference path="exporter.ts" />
/// <reference path="xml.ts" />

module MakerJs.exporter {

    /**
     * The default stroke width in millimeters.
     * @private
     */
    export var svgDefaultStrokeWidth = 0.2;

    export function toSVG(modelToExport: IModel, options?: ISVGRenderOptions): string;
    export function toSVG(pathsToExport: IPath[], options?: ISVGRenderOptions): string;
    export function toSVG(pathToExport: IPath, options?: ISVGRenderOptions): string;

    /**
     * Renders an item in SVG markup.
     * 
     * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
     * @param options Rendering options object.
     * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
     * @param options.origin point object for the rendered reference origin.
     * @param options.scale Number to scale the SVG rendering.
     * @param options.stroke String color of the rendered paths.
     * @param options.strokeWidth Number width of the rendered paths, in the same units as the units parameter.
     * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
     * @param options.useSvgPathOnly Boolean to use SVG path elements instead of line, circle etc.
     * @returns String of XML / SVG content.
     */
    export function toSVG(itemToExport: any, options?: ISVGRenderOptions): string {

        var opts: ISVGRenderOptions = {
            annotate: false,
            origin: null,
            scale: 1,
            stroke: "#000",
            useSvgPathOnly: true,
            viewBox: true
        };

        extendObject(opts, options);

        var elements: string[] = [];

        function append(value) {
            elements.push(value);
        }

        function fixPoint(pointToFix: IPoint): IPoint {
            //in DXF Y increases upward. in SVG, Y increases downward
            var pointMirroredY = point.mirror(pointToFix, false, true);
            return point.scale(pointMirroredY, opts.scale);
        }

        function fixPath(pathToFix: IPath, origin: IPoint): IPath {
            //mirror creates a copy, so we don't modify the original
            var mirrorY = path.mirror(pathToFix, false, true);
            return path.moveRelative(path.scale(mirrorY, opts.scale), origin);
        }

        function createElement(tagname: string, attrs: IXmlTagAttrs, innerText: string = null) {

            var tag = new XmlTag(tagname, attrs);

            if (innerText) {
                tag.innerText = innerText;
            }

            append(tag.toString());
        }

        function drawText(id: string, x: number, y: number) {
            createElement(
                "text",
                {
                    "id": id + "_text",
                    "x": x,
                    "y": y,
                },
                id);
        }

        function drawPath(id: string, x: number, y: number, d: any[], cssStyle: string) {
            createElement(
                "path",
                {
                    "id": id,
                    "d": ["M", round(x), round(y)].concat(d).join(" "),
                    "style": cssStyle
                });

            if (opts.annotate) {
                drawText(id, x, y);
            }
        }

        var map: IPathOriginFunctionMap = {};

        map[pathType.Line] = function (line: IPathLine, origin: IPoint) {

            var start = line.origin;
            var end = line.end;

            if (opts.useSvgPathOnly) {
                drawPath(line.id, start[0], start[1], [round(end[0]), round(end[1])], line.cssStyle);
            } else {
                createElement(
                    "line",
                    {
                        "id": line.id,
                        "x1": round(start[0]),
                        "y1": round(start[1]),
                        "x2": round(end[0]),
                        "y2": round(end[1]),
                        "style": line.cssStyle
                    });
            }

            if (opts.annotate) {
                drawText(line.id, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2);
            }
        };

        map[pathType.Circle] = function (circle: IPathCircle, origin: IPoint) {

            var center = circle.origin;

            if (opts.useSvgPathOnly) {

                var r = circle.radius;
                var d = ['m', -r, 0];

                function halfCircle(sign: number) {
                    d.push('a');
                    svgArcData(d, r, [2 * r * sign, 0]);
                }

                halfCircle(1);
                halfCircle(-1);

                drawPath(circle.id, center[0], center[1], d, circle.cssStyle);

            } else {
                createElement(
                    "circle",
                    {
                        "id": circle.id,
                        "r": circle.radius,
                        "cx": round(center[0]),
                        "cy": round(center[1]),
                        "style": circle.cssStyle
                    });
            }

            if (opts.annotate) {
                drawText(circle.id, center[0], center[1]);
            }
        };

        function svgArcData(d: any[], radius: number, endPoint: IPoint, largeArc?: boolean, decreasing?: boolean) {
            var end: IPoint = endPoint;
            d.push(radius, radius);
            d.push(0);                   //0 = x-axis rotation
            d.push(largeArc ? 1 : 0);    //large arc=1, small arc=0
            d.push(decreasing ? 0 : 1);  //sweep-flag 0=decreasing, 1=increasing 
            d.push(round(end[0]), round(end[1]));
        }

        map[pathType.Arc] = function (arc: IPathArc, origin: IPoint) {

            var arcPoints = point.fromArc(arc);

            var d = ['A'];
            svgArcData(
                d,
                arc.radius,
                arcPoints[1],
                Math.abs(arc.endAngle - arc.startAngle) > 180,
                arc.startAngle > arc.endAngle
            );

            drawPath(arc.id, arcPoints[0][0], arcPoints[0][1], d, arc.cssStyle);
        };

        //fixup options

        //measure the item to move it into svg area

        var modelToMeasure: IModel;

        if (isModel(itemToExport)) {
            modelToMeasure = <IModel>itemToExport;

        } else if (Array.isArray(itemToExport)) {
            //issue: this won't handle an array of models
            modelToMeasure = { id: 'modelToMeasure', paths: <IPath[]>itemToExport };

        } else if (isPath(itemToExport)) {
            modelToMeasure = { id: 'modelToMeasure', paths: [(<IPath>itemToExport)] };
        }

        var size = measure.modelExtents(modelToMeasure);

        if (!opts.origin) {
            var left = 0;
            if (size.low[0] < 0) {
                left = -size.low[0] * opts.scale;
            }
            opts.origin = [left, size.high[1] * opts.scale];
        }

        if (!opts.units) {
            var unitSystem = tryGetModelUnits(itemToExport);
            if (unitSystem) {
                opts.units = unitSystem;
            }
        }

        if (typeof opts.strokeWidth === 'undefined') {
            if (!opts.units) {
                opts.strokeWidth = svgDefaultStrokeWidth;
            } else {
                opts.strokeWidth = round(units.conversionScale(unitType.Millimeter, opts.units) * svgDefaultStrokeWidth, .001);
            }
        }

        //also pass back to options parameter
        extendObject(options, opts);

        //begin svg output

        var modelGroup = new XmlTag('g');

        function beginModel(modelContext: IModel) {
            modelGroup.attrs = {
                id: modelContext.id
            };
            append(modelGroup.getOpeningTag(false));
        }

        function endModel(modelContext: IModel) {
            append(modelGroup.getClosingTag());
        }

        var svgAttrs: IXmlTagAttrs;

        if (opts.viewBox) {
            var width = round(size.high[0] - size.low[0]);
            var height = round(size.high[1] - size.low[1]);
            var viewBox = [0, 0, width, height];
            var unit = svgUnit[opts.units] || '';
            svgAttrs = {
                width: width + unit,
                height: height + unit,
                viewBox: viewBox.join(' ')
            };
        }

        var svgTag = new XmlTag('svg', <IXmlTagAttrs>extendObject(svgAttrs, opts.svgAttrs));

        append(svgTag.getOpeningTag(false));

        var svgGroup = new XmlTag('g', {
            id: 'svgGroup',
            stroke: opts.stroke,
            "stroke-width": opts.strokeWidth,
            "fill": "none"
        });
        append(svgGroup.getOpeningTag(false));

        var exp = new Exporter(map, fixPoint, fixPath, beginModel, endModel);
        exp.exportItem(itemToExport, opts.origin);

        append(svgGroup.getClosingTag());
        append(svgTag.getClosingTag());

        return elements.join('');
    }

    /**
     * @private
     */
    var svgUnit: { [unitType: string]: string } = {};

    //SVG Coordinate Systems, Transformations and Units documentation:
    //http://www.w3.org/TR/SVG/coords.html
    //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.

    svgUnit[unitType.Inch] = "in";
    svgUnit[unitType.Millimeter] = "mm";
    svgUnit[unitType.Centimeter] = "cm";

    /**
     * SVG rendering options.
     */
    export interface ISVGRenderOptions extends IExportOptions {

        /**
         * Optional attributes to add to the root svg tag.
         */
        svgAttrs?: IXmlTagAttrs;

        /**
         * SVG stroke width of paths. This is in the same unit system as the units property.
         */
        strokeWidth?: number;

        /**
         * SVG color of the rendered paths.
         */
        stroke: string;

        /**
         * Scale of the SVG rendering.
         */
        scale: number;

        /**
         *  Indicate that the id's of paths should be rendered as SVG text elements.
         */
        annotate: boolean;

        /**
         * Rendered reference origin. 
         */
        origin: IPoint;

        /**
         * Use SVG < path > elements instead of < line >, < circle > etc.
         */
        useSvgPathOnly: boolean;

        /**
         * Flag to use SVG viewbox. 
         */
        viewBox: boolean;
    }

} 
