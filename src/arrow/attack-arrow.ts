import Base from '../base';
import * as Utils from '../utils';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { PolygonStyle } from '../interface';

export default class AttackArrow extends Base {
  points: Cartesian3[] = [];
  headHeightFactor: number;
  headWidthFactor: number;
  neckHeightFactor: number;
  neckWidthFactor: number;
  headTailFactor: number;
  minPointsForShape: number;

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.headTailFactor = 0.8;
    this.minPointsForShape = 3;
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
    this.points.push(cartesian);
    if (this.points.length < 2) {
      this.onMouseMove();
    } else if (this.points.length === 2) {
      this.setGeometryPoints(this.points);
      this.drawPolygon();
    }
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    const tempPoints = [...this.points, cartesian];
    this.setGeometryPoints(tempPoints);
    if (tempPoints.length === 2) {
      this.addTempLine();
    } else {
      this.removeTempLine();
      const geometryPoints = this.createGraphic(tempPoints);
      this.setGeometryPoints(geometryPoints);
      this.drawPolygon();
    }
  }

  /**
   * Generate geometric shapes based on key points.
   */
  createGraphic(positions: Cartesian3[]): Cartesian3[] {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });

    let [tailLeft, tailRight] = [lnglatPoints[0], lnglatPoints[1]];
    if (Utils.isClockWise(lnglatPoints[0], lnglatPoints[1], lnglatPoints[2])) {
      tailLeft = lnglatPoints[1];
      tailRight = lnglatPoints[0];
    }

    const midTail = Utils.Mid(tailLeft, tailRight);
    const bonePnts = [midTail].concat(lnglatPoints.slice(2));
    const headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
    const [neckLeft, neckRight] = [headPnts[0], headPnts[4]];
    const tailWidthFactor = Utils.MathDistance(tailLeft, tailRight) / Utils.getBaseLength(bonePnts);
    const bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
    const count = bodyPnts.length;
    let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);
    leftPnts = Utils.getQBSplinePoints(leftPnts);
    rightPnts = Utils.getQBSplinePoints(rightPnts);
    const points = leftPnts.concat(headPnts, rightPnts.reverse());
    const temp = [].concat(...points);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }

  getPoints() {
    return this.points;
  }

  getArrowHeadPoints(points, tailLeft, tailRight) {
    try {
      let len = Utils.getBaseLength(points);
      let headHeight = len * this.headHeightFactor;
      const headPnt = points[points.length - 1];
      len = Utils.MathDistance(headPnt, points[points.length - 2]);
      const tailWidth = Utils.MathDistance(tailLeft, tailRight);
      if (headHeight > tailWidth * this.headTailFactor) {
        headHeight = tailWidth * this.headTailFactor;
      }
      const headWidth = headHeight * this.headWidthFactor;
      const neckWidth = headHeight * this.neckWidthFactor;
      headHeight = headHeight > len ? len : headHeight;
      const neckHeight = headHeight * this.neckHeightFactor;
      const headEndPnt = Utils.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
      const neckEndPnt = Utils.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
      const headLeft = Utils.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, false);
      const headRight = Utils.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, true);
      const neckLeft = Utils.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, false);
      const neckRight = Utils.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, true);
      return [neckLeft, headLeft, headPnt, headRight, neckRight];
    } catch (e) {
      console.log(e);
    }
  }

  getArrowBodyPoints(points, neckLeft, neckRight, tailWidthFactor) {
    const allLen = Utils.wholeDistance(points);
    const len = Utils.getBaseLength(points);
    const tailWidth = len * tailWidthFactor;
    const neckWidth = Utils.MathDistance(neckLeft, neckRight);
    const widthDif = (tailWidth - neckWidth) / 2;
    let [tempLen, leftBodyPnts, rightBodyPnts] = [0, [], []];
    for (let i = 1; i < points.length - 1; i++) {
      const angle = Utils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
      tempLen += Utils.MathDistance(points[i - 1], points[i]);
      const w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
      const left = Utils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
      const right = Utils.getThirdPoint(points[i - 1], points[i], angle, w, false);
      leftBodyPnts.push(left);
      rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
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
}
