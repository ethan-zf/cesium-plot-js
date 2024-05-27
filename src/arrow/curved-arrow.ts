import * as Utils from '../utils';
import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { LineStyle } from '../interface';

export default class CurvedArrow extends Base {
  points: Cartesian3[] = [];
  arrowLengthScale: number = 5;
  maxArrowLength: number = 3000000;
  t: number;
  minPointsForShape: number;

  constructor(cesium: any, viewer: any, style?: LineStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.t = 0.3;
    this.minPointsForShape = 2;
    this.setState('drawing');
    this.onDoubleClick();
  }

  getType(): 'polygon' | 'line' {
    return 'line';
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    if (this.points.length < 2) {
      this.onMouseMove();
    }
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    const tempPoints = [...this.points, cartesian];
    let geometryPoints = this.createGraphic(tempPoints);
    this.setGeometryPoints(geometryPoints);
    this.drawLine();
  }

  createStraightArrow(positions: Cartesian3[]) {
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
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });

    if (positions.length === 2) {
      // If there are only two points, draw a fine straight arrow.
      return this.createStraightArrow(positions);
    }

    const curvePoints = Utils.getCurvePoints(this.t, lnglatPoints);
    const pnt1 = lnglatPoints[lnglatPoints.length - 2];
    const pnt2 = lnglatPoints[lnglatPoints.length - 1];

    const distance = Utils.wholeDistance(lnglatPoints);
    let len = distance / this.arrowLengthScale;
    len = len > this.maxArrowLength ? this.maxArrowLength : len;
    const leftPnt = Utils.getThirdPoint(curvePoints[curvePoints.length - 2], curvePoints[curvePoints.length - 1], Math.PI / 6, len / 2, false);
    const rightPnt = Utils.getThirdPoint(curvePoints[curvePoints.length - 2], curvePoints[curvePoints.length - 1], Math.PI / 6, len / 2, true);
    const temp = [].concat(...curvePoints);
    const points = [...temp, ...leftPnt, ...pnt2, ...rightPnt];
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(points);
    return cartesianPoints;
  }

  getPoints() {
    return this.points;
  }
}
