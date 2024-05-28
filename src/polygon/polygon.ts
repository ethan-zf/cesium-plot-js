import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'cesium';

import { PolygonStyle } from '../interface';

export default class Polygon extends Base {
  points: Cartesian3[] = [];

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.setState('drawing');
    this.onDoubleClick();
  }

  getType(): 'polygon' | 'line' {
    return 'polygon';
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    let endPoint = cartesian;
    if (this.points.length > 2) {
      endPoint = this.getEndPoint(cartesian);
    }
    this.points.push(endPoint);
    if (this.points.length === 1) {
      this.onMouseMove();
    }
    if (this.points.length > 2 && this.comparePositions(this.points[0], endPoint)) {
      this.finishDrawing();
    }
  }

  /**
   * Compare whether the positions of two points are equal.
   */
  comparePositions(point1: Cartesian3, point2: Cartesian3) {
    const lnglat1 = this.cartesianToLnglat(point1);
    const lnglat2 = this.cartesianToLnglat(point2);
    return lnglat1[0] === lnglat2[0] && lnglat1[1] === lnglat2[1];
  }

  /**
   * Calculate the distance between two points
   */
  calculateDistance(point1: Cartesian3, point2: Cartesian3) {
    return this.cesium.Cartesian3.distance(point1, point2);
  }

  /**
   * get end point
   */
  getEndPoint(cartesian: Cartesian3) {
    let endPoint = cartesian;
    let distance = this.calculateDistance(this.points[0], cartesian);
    if (distance < 100) endPoint = this.points[0];
    return endPoint;
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    let endPoint = cartesian;
    if (this.points.length > 2) {
      endPoint = this.getEndPoint(cartesian);
    }
    const tempPoints = [...this.points, endPoint];
    this.setGeometryPoints(tempPoints);
    if (tempPoints.length === 2) {
      this.addTempLine();
    } else {
      this.removeTempLine();
      this.drawPolygon();
    }
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    this.setGeometryPoints(this.points);
    this.drawPolygon();
  }

  getPoints() {
    return this.points;
  }
}
