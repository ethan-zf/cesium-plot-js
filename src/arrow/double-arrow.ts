import Base from '../base';
import * as Utils from '../utils';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { PolygonStyle } from '../interface';
type Position = [number, number];

export default class DoubleArrow extends Base {
  points: Cartesian3[] = [];
  arrowLengthScale: number = 5;
  maxArrowLength: number = 2;
  neckWidthFactor: number;
  headWidthFactor: number;
  headHeightFactor: number;
  neckHeightFactor: number;
  connPoint: Position;
  tempPoint4: Position;
  minPointsForShape: number;
  llBodyPnts: Position[] = [];
  rrBodyPnts: Position[] = [];
  curveControlPointLeft: Cartesian3;
  curveControlPointRight: Cartesian3;
  isClockWise: boolean;

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.headHeightFactor = 0.25;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.connPoint = [0, 0];
    this.tempPoint4 = [0, 0];
    this.minPointsForShape = 4;
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
    if (this.points.length < 2) {
      this.onMouseMove();
    } else if (this.points.length === 2) {
      this.setGeometryPoints(this.points);
      this.drawPolygon();
    } else if (this.points.length === 3) {
      this.lineEntity && this.viewer.entities.remove(this.lineEntity);
    } else {
      this.finishDrawing();

      // // 辅助查看插值控制点位置
      // this.viewer.entities.add({
      // 	position: this.curveControlPointLeft,
      // 	point: {
      // 		pixelSize: 10,
      // 		heightReference: this.cesium.HeightReference.CLAMP_TO_GROUND,
      // 		color: this.cesium.Color.RED,
      // 	},
      // });
      // this.viewer.entities.add({
      // 	position: this.curveControlPointRight,
      // 	point: {
      // 		pixelSize: 10,
      // 		heightReference: this.cesium.HeightReference.CLAMP_TO_GROUND,
      // 		color: this.cesium.Color.RED,
      // 	},
      // });
    }
  }

  finishDrawing() {
    this.curveControlPointLeft = this.cesium.Cartesian3.fromDegrees(this.llBodyPnts[2][0], this.llBodyPnts[2][1]);
    this.curveControlPointRight = this.cesium.Cartesian3.fromDegrees(this.rrBodyPnts[1][0], this.rrBodyPnts[1][1]);
    super.finishDrawing();
  }
  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    const tempPoints = [...this.points, cartesian];
    this.setGeometryPoints(tempPoints);
    if (tempPoints.length === 2) {
      this.addTempLine();
    } else if (tempPoints.length > 2) {
      this.removeTempLine();
      const geometryPoints = this.createGraphic(tempPoints);
      this.setGeometryPoints(geometryPoints);
      this.drawPolygon();
    }
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

  /**
   * Generate geometric shapes based on key points.
   */
  createGraphic(positions: Cartesian3[]) {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });
    const [pnt1, pnt2, pnt3] = [lnglatPoints[0], lnglatPoints[1], lnglatPoints[2]];
    const count = lnglatPoints.length;
    if (count === 3) {
      this.tempPoint4 = this.getTempPoint4(pnt1, pnt2, pnt3);
      this.connPoint = Utils.Mid(pnt1, pnt2);
    } else if (count === 4) {
      this.tempPoint4 = lnglatPoints[3];
      this.connPoint = Utils.Mid(pnt1, pnt2);
    } else {
      this.tempPoint4 = lnglatPoints[3];
      this.connPoint = lnglatPoints[4];
    }
    let leftArrowPnts: Position[];
    let rightArrowPnts;
    this.isClockWise = Utils.isClockWise(pnt1, pnt2, pnt3);
    if (this.isClockWise) {
      leftArrowPnts = this.getArrowPoints(pnt1, this.connPoint, this.tempPoint4, false);
      rightArrowPnts = this.getArrowPoints(this.connPoint, pnt2, pnt3, true);
    } else {
      leftArrowPnts = this.getArrowPoints(pnt2, this.connPoint, pnt3, false);
      rightArrowPnts = this.getArrowPoints(this.connPoint, pnt1, this.tempPoint4, true);
    }
    const m = leftArrowPnts.length;
    const t = (m - 5) / 2;
    const llBodyPnts = leftArrowPnts.slice(0, t);
    const lArrowPnts = leftArrowPnts.slice(t, t + 5);
    let lrBodyPnts = leftArrowPnts.slice(t + 5, m);
    this.llBodyPnts = llBodyPnts;
    let rlBodyPnts = rightArrowPnts.slice(0, t);
    const rArrowPnts = rightArrowPnts.slice(t, t + 5);
    const rrBodyPnts = rightArrowPnts.slice(t + 5, m);
    this.rrBodyPnts = rrBodyPnts;
    rlBodyPnts = Utils.getBezierPoints(rlBodyPnts);
    const bodyPnts = Utils.getBezierPoints(rrBodyPnts.concat(llBodyPnts.slice(1)));
    lrBodyPnts = Utils.getBezierPoints(lrBodyPnts);
    const pnts = rlBodyPnts.concat(rArrowPnts, bodyPnts, lArrowPnts, lrBodyPnts);
    const temp = [].concat(...pnts);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }

  getTempPoint4(linePnt1: Position, linePnt2: Position, point: Position): Position {
    const midPnt = Utils.Mid(linePnt1, linePnt2);
    const len = Utils.MathDistance(midPnt, point);
    const angle = Utils.getAngleOfThreePoints(linePnt1, midPnt, point);
    let symPnt = [0, 0] as Position;
    let distance1;
    let distance2;
    let mid;
    if (angle < Math.PI / 2) {
      distance1 = len * Math.sin(angle);
      distance2 = len * Math.cos(angle);
      mid = Utils.getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, false);
      symPnt = Utils.getThirdPoint(midPnt, mid, Math.PI / 2, distance2, true);
    } else if (angle >= Math.PI / 2 && angle < Math.PI) {
      distance1 = len * Math.sin(Math.PI - angle);
      distance2 = len * Math.cos(Math.PI - angle);
      mid = Utils.getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, false);
      symPnt = Utils.getThirdPoint(midPnt, mid, Math.PI / 2, distance2, false);
    } else if (angle >= Math.PI && angle < Math.PI * 1.5) {
      distance1 = len * Math.sin(angle - Math.PI);
      distance2 = len * Math.cos(angle - Math.PI);
      mid = Utils.getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, true);
      symPnt = Utils.getThirdPoint(midPnt, mid, Math.PI / 2, distance2, true);
    } else {
      distance1 = len * Math.sin(Math.PI * 2 - angle);
      distance2 = len * Math.cos(Math.PI * 2 - angle);
      mid = Utils.getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, true);
      symPnt = Utils.getThirdPoint(midPnt, mid, Math.PI / 2, distance2, false);
    }
    return symPnt;
  }

  getArrowPoints(pnt1: Position, pnt2: Position, pnt3: Position, clockWise: boolean): Position[] {
    const midPnt = Utils.Mid(pnt1, pnt2);
    const len = Utils.MathDistance(midPnt, pnt3);
    let midPnt1 = Utils.getThirdPoint(pnt3, midPnt, 0, len * 0.3, true);
    let midPnt2 = Utils.getThirdPoint(pnt3, midPnt, 0, len * 0.5, true);
    midPnt1 = Utils.getThirdPoint(midPnt, midPnt1, Math.PI / 2, len / 5, clockWise);

    midPnt2 = Utils.getThirdPoint(midPnt, midPnt2, Math.PI / 2, len / 4, clockWise);
    const points = [midPnt, midPnt1, midPnt2, pnt3];
    const arrowPnts = this.getArrowHeadPoints(points);
    if (arrowPnts && Array.isArray(arrowPnts) && arrowPnts.length > 0) {
      const neckLeftPoint: Position = arrowPnts[0];
      const neckRightPoint: Position = arrowPnts[4];
      const tailWidthFactor = Utils.MathDistance(pnt1, pnt2) / Utils.getBaseLength(points) / 2;
      const bodyPnts = this.getArrowBodyPoints(points, neckLeftPoint, neckRightPoint, tailWidthFactor);
      if (bodyPnts) {
        const n = bodyPnts.length;
        let lPoints = bodyPnts.slice(0, n / 2);
        let rPoints = bodyPnts.slice(n / 2, n);
        lPoints.push(neckLeftPoint);
        rPoints.push(neckRightPoint);
        lPoints = lPoints.reverse();
        lPoints.push(pnt2);
        rPoints = rPoints.reverse();
        rPoints.push(pnt1);
        return lPoints.reverse().concat(arrowPnts, rPoints);
      }
    } else {
      throw new Error('Interpolation Error');
    }
  }

  getArrowBodyPoints(points: Position[], neckLeft: Position, neckRight: Position, tailWidthFactor: number): Position[] {
    const allLen = Utils.wholeDistance(points);
    const len = Utils.getBaseLength(points);
    const tailWidth = len * tailWidthFactor;
    const neckWidth = Utils.MathDistance(neckLeft, neckRight);
    const widthDif = (tailWidth - neckWidth) / 2;
    let tempLen: number = 0;
    let leftBodyPnts: Position[] = [];
    let rightBodyPnts: Position[] = [];
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

  getArrowHeadPoints(points: Position[]): Position[] {
    const len = Utils.getBaseLength(points);
    const headHeight = len * this.headHeightFactor;
    const headPnt = points[points.length - 1];
    const headWidth = headHeight * this.headWidthFactor;
    const neckWidth = headHeight * this.neckWidthFactor;
    const neckHeight = headHeight * this.neckHeightFactor;
    const headEndPnt = Utils.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
    const neckEndPnt = Utils.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
    const headLeft = Utils.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, false);
    const headRight = Utils.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, true);
    const neckLeft = Utils.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, false);
    const neckRight = Utils.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, true);
    return [neckLeft, headLeft, headPnt, headRight, neckRight];
  }

  getPoints() {
    return this.points;
  }

  getBezierControlPointforGrowthAnimation() {
    return this.isClockWise
      ? {
          left: this.curveControlPointLeft,
          right: this.curveControlPointRight,
        }
      : {
          right: this.curveControlPointLeft,
          left: this.curveControlPointRight,
        };
  }
}
