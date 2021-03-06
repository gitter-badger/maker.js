/// <reference path="model.ts" />
/// <reference path="units.ts" />
/// <reference path="measure.ts" />

module MakerJs.exporter {

    /**
     * @private
     */
    export interface IExportOptions {
        /**
         * Unit system to embed in exported file.
         */
        units?: string;
    }

    /**
     * Try to get the unit system from a model
     * @private
     */
    export function tryGetModelUnits(itemToExport: any) {
        if (isModel(itemToExport)) {
            return (<IModel>itemToExport).units;
        }
    }

    /**
     * Class to traverse an item 's models or paths and ultimately render each path.
     * @private
     */
    export class Exporter {

    /**
     * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value 
     * is a function to render a path. Function parameters are path and point.
     * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
     * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
     */
        constructor(
            private map: IPathOriginFunctionMap,
            private fixPoint?: (pointToFix: IPoint) => IPoint,
            private fixPath?: (pathToFix: IPath, origin: IPoint) => IPath,
            private beginModel?: (modelContext: IModel) => void,
            private endModel?: (modelContext: IModel) => void
            ) {
        }

        /**
         * Export a path.
         * 
         * @param pathToExport The path to export.
         * @param offset The offset position of the path. 
         */
        public exportPath(pathToExport: IPath, offset: IPoint) {
            var fn = this.map[pathToExport.type];
            if (fn) {
                fn(this.fixPath? this.fixPath(pathToExport, offset) : pathToExport, offset);
            }
        }

        /**
         * Export a model.
         * 
         * @param modelToExport The model to export.
         * @param offset The offset position of the model.
         */
        public exportModel(modelToExport: IModel, offset: IPoint) {

            if (this.beginModel) {
                this.beginModel(modelToExport);
            }

            var newOffset = point.add((this.fixPoint ? this.fixPoint(modelToExport.origin) : modelToExport.origin), offset);

            if (modelToExport.paths) {
                for (var i = 0; i < modelToExport.paths.length; i++) {
                    this.exportPath(modelToExport.paths[i], newOffset);
                }
            }

            if (modelToExport.models) {
                for (var i = 0; i < modelToExport.models.length; i++) {
                    this.exportModel(modelToExport.models[i], newOffset);
                }
            }

            if (this.endModel) {
                this.endModel(modelToExport);
            }

        }

        /**
         * Export an object.
         * 
         * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
         * @param offset The offset position of the object.
         */
        public exportItem(itemToExport: any, origin: IPoint) {

            if (isModel(itemToExport)) {
                this.exportModel(<IModel>itemToExport, origin);

            } else if (Array.isArray(itemToExport)) {
                var items: any[] = itemToExport;
                for (var i = 0; i < items.length; i++) {
                    this.exportItem(items[i], origin);
                }

            } else if (isPath(itemToExport)) {
                this.exportPath(<IPath>itemToExport, origin);
            }
        }

    }
}
