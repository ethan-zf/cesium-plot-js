import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'cesium';

import { PolygonStyle, Shape } from '../interface';

export default class Rectangle extends Base {
  points: Cartesian3[] = [];

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.setState('drawing');
  }

  getType(): Shape {
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
    const [p1, p2] = positions.map(this.cartesianToLnglat);
    const coords = [...p1, p1[0], p2[1], ...p2, p2[0], p1[1], ...p1];
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(coords);
    return cartesianPoints;
  }

  getPoints() {
    return this.points;
  }
}
