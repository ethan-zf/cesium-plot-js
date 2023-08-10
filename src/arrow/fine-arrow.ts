import Draw from '../draw';
import * as Utils from '../utils';
import { Cartesian3 } from '../../examples/cesium';

export default class FineArrow extends Draw {
  points: Cartesian3[] = [];

  constructor(cesium: any, viewer: any, style: any) {
    super(cesium, viewer);
    this.cesium = cesium;
    this.onClick();
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    if (this.points.length === 1) {
      this.onMouseMove();
    }
    if (this.points.length === 2) {
      const geometryPoints = this.createPolygon(this.points);
      this.setGeometryPoints(geometryPoints);
      this.addToMap();
      this.removeClickListener();
      this.removeMoveListener();
    }
  }

  /**
   * Update the last point as the mouse moves.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    let tempPoints = [...this.points, cartesian];
    const geometryPoints = this.createPolygon(tempPoints);
    this.setGeometryPoints(geometryPoints);
    this.addToMap();
  }

  /**
   * Generate geometric shapes based on key points.
   */
  createPolygon(positions: Cartesian3[]) {
    const [p1, p2] = positions.map(this.cartesianToLnglat);
    const len = Utils.getBaseLength([p1, p2]);
    const tailWidth = len * this.tailWidthFactor;
    const neckWidth = len * this.neckWidthFactor;
    const headWidth = len * this.headWidthFactor;
    const tailLeft = Utils.getThirdPoint(p2, p1, Math.PI / 2, tailWidth, true);
    const tailRight = Utils.getThirdPoint(p2, p1, Math.PI / 2, tailWidth, false);
    const headLeft = Utils.getThirdPoint(p1, p2, this.headAngle, headWidth, false);
    const headRight = Utils.getThirdPoint(p1, p2, this.headAngle, headWidth, true);
    const neckLeft = Utils.getThirdPoint(p1, p2, this.neckAngle, neckWidth, false);
    const neckRight = Utils.getThirdPoint(p1, p2, this.neckAngle, neckWidth, true);
    const points = [...tailLeft, ...neckLeft, ...headLeft, ...p2, ...headRight, ...neckRight, ...tailRight, ...p1];
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(points);
    return cartesianPoints;
  }
}
