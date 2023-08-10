import Draw from '../draw';
import * as Utils from '../utils';

export default class FineArrow extends Draw {
  points: any = [];
  constructor(cesium, viewer, style) {
    super(cesium, viewer);
    this.cesium = cesium;
    // this.setPoints = this.setPoints.bind(this);
    this.onClick();
  }

  addPoint(cartesian) {
    this.points.push(cartesian);
    if (this.points.length == 2) {
      const geometryPoints = this.createPolygon(this.points);
      this.setGeometryPoints(geometryPoints);
      this.addToMap();
      this.removeEventListener();
    }
  }

  updateMovingPoint(cartesian) {
    let tempPoints = [].concat(this.points);
    tempPoints = tempPoints.concat([cartesian]);
    const geometryPoints = this.createPolygon(tempPoints);
    this.setGeometryPoints(geometryPoints);
    this.addToMap();
  }

  createPolygon(positions) {
    const p1 = this.cartesianToLnglat(positions[0]);
    const p2 = this.cartesianToLnglat(positions[1]);
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
