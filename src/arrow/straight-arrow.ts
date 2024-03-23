import * as Utils from '../utils';
import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { LineStyle } from '../interface';

export default class StraightArrow extends Base {
  points: Cartesian3[] = [];
  arrowLengthScale: number = 5;
  maxArrowLength: number = 3000000;
  minPointsForShape: number;

  constructor(cesium: any, viewer: any, style?: LineStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.minPointsForShape = 2;
    this.setState('drawing');
  }

  getType(): 'polygon' | 'line' {
    return 'line';
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    if (this.points.length < 2) {
      this.points.push(cartesian);
      this.onMouseMove();
    }
    if (this.points.length === 2) {
      const geometryPoints = this.createGraphic(this.points);
      this.setGeometryPoints(geometryPoints);
      this.drawLine();
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
    this.drawLine();
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    const geometryPoints = this.createGraphic(this.points);
    this.setGeometryPoints(geometryPoints);
    this.drawLine();
  }

  /**
   * Generate geometric shapes based on key points.
   */
  createGraphic(positions: Cartesian3[]) {
    const [pnt1, pnt2] = positions.map(this.cartesianToLnglat);
    const distance = Utils.MathDistance(pnt1, pnt2);
    let len = distance / this.arrowLengthScale;
    len = len > this.maxArrowLength ? this.maxArrowLength : len;
    const leftPnt = Utils.getThirdPoint(pnt1, pnt2, Math.PI / 6, len / 2, false);
    const rightPnt = Utils.getThirdPoint(pnt1, pnt2, Math.PI / 6, len / 2, true);
    const points = [...pnt1, ...pnt2, ...leftPnt, ...pnt2, ...rightPnt];
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(points);
    return cartesianPoints;
  }

  getPoints() {
    return this.points;
  }
}
