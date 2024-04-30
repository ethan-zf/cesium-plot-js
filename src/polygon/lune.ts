import Base from '../base';
import * as Utils from '../utils';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { PolygonStyle } from '../interface';

export default class Lune extends Base {
  points: Cartesian3[] = [];
  freehand: boolean;

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.freehand = true;
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
    if (this.points.length === 1) {
      this.onMouseMove();
    } else if (this.points.length === 2) {
    } else if (this.points.length > 2) {
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
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });

    if (lnglatPoints.length === 2) {
      const mid = Utils.Mid(lnglatPoints[0], lnglatPoints[1]);
      const d = Utils.MathDistance(lnglatPoints[0], mid);
      const pnt = Utils.getThirdPoint(lnglatPoints[0], mid, Math.PI / 2, d, false);
      lnglatPoints.push(pnt);
    }
    let [pnt1, pnt2, pnt3, startAngle, endAngle] = [
      lnglatPoints[0],
      lnglatPoints[1],
      lnglatPoints[2],
      undefined,
      undefined,
    ];
    const center = Utils.getCircleCenterOfThreePoints(pnt1, pnt2, pnt3);
    const radius = Utils.MathDistance(pnt1, center);
    const angle1 = Utils.getAzimuth(pnt1, center);
    const angle2 = Utils.getAzimuth(pnt2, center);
    if (Utils.isClockWise(pnt1, pnt2, pnt3)) {
      startAngle = angle2;
      endAngle = angle1;
    } else {
      startAngle = angle1;
      endAngle = angle2;
    }

    let points = Utils.getArcPoints(center, radius, startAngle, endAngle);
    const temp = [].concat(...points);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }

  getPoints() {
    return this.points;
  }
}
