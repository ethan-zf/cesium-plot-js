import * as Utils from '../utils';
import AttackArrow from './attack-arrow';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { PolygonStyle } from '../interface';

export default class SwallowtailAttackArrow extends AttackArrow {
  points: Cartesian3[] = [];
  headHeightFactor: number;
  headWidthFactor: number;
  neckHeightFactor: number;
  neckWidthFactor: number;
  headTailFactor: number;
  tailWidthFactor: number;
  swallowTailFactor: number;
  swallowTailPnt: [number, number];

  constructor(cesium: any, viewer: any, style: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.tailWidthFactor = 0.1;
    this.headTailFactor = 0.8;
    this.swallowTailFactor = 1;
    this.swallowTailPnt = [0, 0];
    this.minPointsForShape = 3;
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
    const tailWidth = Utils.MathDistance(tailLeft, tailRight);
    const allLen = Utils.getBaseLength(bonePnts);
    const len = allLen * this.tailWidthFactor * this.swallowTailFactor;
    this.swallowTailPnt = Utils.getThirdPoint(bonePnts[1], bonePnts[0], 0, len, true);
    const factor = tailWidth / allLen;
    const bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, factor);
    const count = bodyPnts.length;
    let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);
    leftPnts = Utils.getQBSplinePoints(leftPnts);
    rightPnts = Utils.getQBSplinePoints(rightPnts);
    const points = leftPnts.concat(headPnts, rightPnts.reverse(), [this.swallowTailPnt, leftPnts[0]]);
    const temp = [].concat(...points);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }
}
