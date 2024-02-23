/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.99
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

define(['exports', './Matrix2-036c77dd', './Matrix3-f22b0303', './Check-d10e5f2e', './OrientedBoundingBox-7e2eebab'], (function (exports, Matrix2, Matrix3, Check, OrientedBoundingBox) { 'use strict';

  /**
   * @private
   */
  const CoplanarPolygonGeometryLibrary = {};

  const scratchIntersectionPoint = new Matrix3.Cartesian3();
  const scratchXAxis = new Matrix3.Cartesian3();
  const scratchYAxis = new Matrix3.Cartesian3();
  const scratchZAxis = new Matrix3.Cartesian3();
  const obbScratch = new OrientedBoundingBox.OrientedBoundingBox();

  CoplanarPolygonGeometryLibrary.validOutline = function (positions) {
    //>>includeStart('debug', pragmas.debug);
    Check.Check.defined("positions", positions);
    //>>includeEnd('debug');

    const orientedBoundingBox = OrientedBoundingBox.OrientedBoundingBox.fromPoints(
      positions,
      obbScratch
    );
    const halfAxes = orientedBoundingBox.halfAxes;
    const xAxis = Matrix3.Matrix3.getColumn(halfAxes, 0, scratchXAxis);
    const yAxis = Matrix3.Matrix3.getColumn(halfAxes, 1, scratchYAxis);
    const zAxis = Matrix3.Matrix3.getColumn(halfAxes, 2, scratchZAxis);

    const xMag = Matrix3.Cartesian3.magnitude(xAxis);
    const yMag = Matrix3.Cartesian3.magnitude(yAxis);
    const zMag = Matrix3.Cartesian3.magnitude(zAxis);

    // If all the points are on a line return undefined because we can't draw a polygon
    return !(
      (xMag === 0 && (yMag === 0 || zMag === 0)) ||
      (yMag === 0 && zMag === 0)
    );
  };

  // call after removeDuplicates
  CoplanarPolygonGeometryLibrary.computeProjectTo2DArguments = function (
    positions,
    centerResult,
    planeAxis1Result,
    planeAxis2Result
  ) {
    //>>includeStart('debug', pragmas.debug);
    Check.Check.defined("positions", positions);
    Check.Check.defined("centerResult", centerResult);
    Check.Check.defined("planeAxis1Result", planeAxis1Result);
    Check.Check.defined("planeAxis2Result", planeAxis2Result);
    //>>includeEnd('debug');

    const orientedBoundingBox = OrientedBoundingBox.OrientedBoundingBox.fromPoints(
      positions,
      obbScratch
    );
    const halfAxes = orientedBoundingBox.halfAxes;
    const xAxis = Matrix3.Matrix3.getColumn(halfAxes, 0, scratchXAxis);
    const yAxis = Matrix3.Matrix3.getColumn(halfAxes, 1, scratchYAxis);
    const zAxis = Matrix3.Matrix3.getColumn(halfAxes, 2, scratchZAxis);

    const xMag = Matrix3.Cartesian3.magnitude(xAxis);
    const yMag = Matrix3.Cartesian3.magnitude(yAxis);
    const zMag = Matrix3.Cartesian3.magnitude(zAxis);
    const min = Math.min(xMag, yMag, zMag);

    // If all the points are on a line return undefined because we can't draw a polygon
    if (
      (xMag === 0 && (yMag === 0 || zMag === 0)) ||
      (yMag === 0 && zMag === 0)
    ) {
      return false;
    }

    let planeAxis1;
    let planeAxis2;

    if (min === yMag || min === zMag) {
      planeAxis1 = xAxis;
    }
    if (min === xMag) {
      planeAxis1 = yAxis;
    } else if (min === zMag) {
      planeAxis2 = yAxis;
    }
    if (min === xMag || min === yMag) {
      planeAxis2 = zAxis;
    }

    Matrix3.Cartesian3.normalize(planeAxis1, planeAxis1Result);
    Matrix3.Cartesian3.normalize(planeAxis2, planeAxis2Result);
    Matrix3.Cartesian3.clone(orientedBoundingBox.center, centerResult);
    return true;
  };

  function projectTo2D(position, center, axis1, axis2, result) {
    const v = Matrix3.Cartesian3.subtract(position, center, scratchIntersectionPoint);
    const x = Matrix3.Cartesian3.dot(axis1, v);
    const y = Matrix3.Cartesian3.dot(axis2, v);

    return Matrix2.Cartesian2.fromElements(x, y, result);
  }

  CoplanarPolygonGeometryLibrary.createProjectPointsTo2DFunction = function (
    center,
    axis1,
    axis2
  ) {
    return function (positions) {
      const positionResults = new Array(positions.length);
      for (let i = 0; i < positions.length; i++) {
        positionResults[i] = projectTo2D(positions[i], center, axis1, axis2);
      }

      return positionResults;
    };
  };

  CoplanarPolygonGeometryLibrary.createProjectPointTo2DFunction = function (
    center,
    axis1,
    axis2
  ) {
    return function (position, result) {
      return projectTo2D(position, center, axis1, axis2, result);
    };
  };
  var CoplanarPolygonGeometryLibrary$1 = CoplanarPolygonGeometryLibrary;

  exports.CoplanarPolygonGeometryLibrary = CoplanarPolygonGeometryLibrary$1;

}));
//# sourceMappingURL=CoplanarPolygonGeometryLibrary-dfba6465.js.map
