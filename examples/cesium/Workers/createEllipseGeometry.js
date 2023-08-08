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

define(['./Matrix3-f22b0303', './defaultValue-0ab18f7d', './EllipseGeometry-6f0c1448', './Check-d10e5f2e', './Math-9be8b918', './Transforms-11fb6b0a', './Matrix2-036c77dd', './RuntimeError-e5c6a8b9', './combine-4598d225', './ComponentDatatype-13a5630b', './WebGLConstants-f27a5e29', './EllipseGeometryLibrary-d3f88cc2', './GeometryAttribute-f2746b95', './GeometryAttributes-eb2609b7', './GeometryInstance-b2be3e5a', './GeometryOffsetAttribute-cc320d7d', './GeometryPipeline-f28890f4', './AttributeCompression-e9888cb8', './EncodedCartesian3-38e2691f', './IndexDatatype-b4e5cf89', './IntersectionTests-2c7928de', './Plane-c9f1487d', './VertexFormat-f2d74c96'], (function (Matrix3, defaultValue, EllipseGeometry, Check, Math, Transforms, Matrix2, RuntimeError, combine, ComponentDatatype, WebGLConstants, EllipseGeometryLibrary, GeometryAttribute, GeometryAttributes, GeometryInstance, GeometryOffsetAttribute, GeometryPipeline, AttributeCompression, EncodedCartesian3, IndexDatatype, IntersectionTests, Plane, VertexFormat) { 'use strict';

  function createEllipseGeometry(ellipseGeometry, offset) {
    if (defaultValue.defined(offset)) {
      ellipseGeometry = EllipseGeometry.EllipseGeometry.unpack(ellipseGeometry, offset);
    }
    ellipseGeometry._center = Matrix3.Cartesian3.clone(ellipseGeometry._center);
    ellipseGeometry._ellipsoid = Matrix3.Ellipsoid.clone(ellipseGeometry._ellipsoid);
    return EllipseGeometry.EllipseGeometry.createGeometry(ellipseGeometry);
  }

  return createEllipseGeometry;

}));
//# sourceMappingURL=createEllipseGeometry.js.map
