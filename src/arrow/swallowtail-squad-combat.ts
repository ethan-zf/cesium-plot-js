import * as Utils from '../utils';
import SquadCombat from './squad-combat';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { PolygonStyle } from '../interface';

export default class SwallowtailSquadCombat extends SquadCombat {
  points: Cartesian3[] = [];
  headHeightFactor: number;
  headWidthFactor: number;
  neckHeightFactor: number;
  neckWidthFactor: number;
  tailWidthFactor: number;
  swallowTailFactor: number;

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);

    this.cesium = cesium;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.tailWidthFactor = 0.1;
    this.swallowTailFactor = 1;
    this.minPointsForShape = 2;
  }

  /**
   * Generate geometric shapes based on key points.
   */
  createGraphic(positions: Cartesian3[]): Cartesian3[] {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });

    const tailPnts = this.getTailPoints(lnglatPoints);
    const headPnts = this.getArrowHeadPoints(lnglatPoints, tailPnts[0], tailPnts[2]);
    const neckLeft = headPnts[0];
    const neckRight = headPnts[4];
    const bodyPnts = this.getArrowBodyPoints(lnglatPoints, neckLeft, neckRight, this.tailWidthFactor);
    const count = bodyPnts.length;
    let leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    let rightPnts = [tailPnts[2]].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);
    leftPnts = Utils.getQBSplinePoints(leftPnts);
    rightPnts = Utils.getQBSplinePoints(rightPnts);

    const points = leftPnts.concat(headPnts, rightPnts.reverse(), [tailPnts[1], leftPnts[0]]);
    const temp = [].concat(...points);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }

  getTailPoints(points) {
    const allLen = Utils.getBaseLength(points);
    const tailWidth = allLen * this.tailWidthFactor;
    const tailLeft = Utils.getThirdPoint(points[1], points[0], Math.PI / 2, tailWidth, false);
    const tailRight = Utils.getThirdPoint(points[1], points[0], Math.PI / 2, tailWidth, true);
    const len = tailWidth * this.swallowTailFactor;
    const swallowTailPnt = Utils.getThirdPoint(points[1], points[0], 0, len, true);
    return [tailLeft, swallowTailPnt, tailRight];
  }
}
