import Base from '../base';
import * as Utils from '../utils';
// @ts-ignore
import { Cartesian3 } from 'cesium';

import { PolygonStyle } from '../interface';

export default class Circle extends Base {
  points: Cartesian3[] = [];
  freehand: boolean;

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.freehand = true;
    this.setState('drawing');
  }

  getType(): 'polygon' | 'line' {
    return 'polygon';
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    if (this.points.length === 1) {
      this.onMouseMove();
    } else if (this.points.length > 1) {
      this.finishDrawing();
    }
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    const tempPoints = [...this.points, cartesian];
    const geometryPoints = this.createGraphic(tempPoints);
    this.setGeometryPoints(geometryPoints);
    this.drawPolygon();
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    const geometryPoints = this.createGraphic(this.points);
    this.setGeometryPoints(geometryPoints);
    this.drawPolygon();
  }

  createGraphic(positions: Cartesian3[]) {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });
    const center = lnglatPoints[0];
    const pnt2 = lnglatPoints[1];

    const radius = Utils.MathDistance(center, pnt2);

    const res = this.generatePoints(center, radius);
    const temp = [].concat(...res);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }

  generatePoints(center, radius) {
    let x, y, angle;
    const points = [];
    for (let i = 0; i <= 100; i++) {
      angle = (Math.PI * 2 * i) / 100;
      x = center[0] + radius * Math.cos(angle);
      y = center[1] + radius * Math.sin(angle);
      points.push([x, y]);
    }
    return points;
  }

  getPoints() {
    return this.points;
  }
}
