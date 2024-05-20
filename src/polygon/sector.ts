import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import * as Utils from '../utils';
import { PolygonStyle } from '../interface';

export default class Sector extends Base {
  points: Cartesian3[] = [];

  constructor(cesium: any, viewer: any, style?: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
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
    }else if (this.points.length === 3) {
      this.finishDrawing();
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

  createGraphic(positions: Cartesian3[]) {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });
    const [center, pnt2, pnt3] = [lnglatPoints[0], lnglatPoints[1], lnglatPoints[2]];
    const radius = Utils.MathDistance(pnt2, center);
    const startAngle = Utils.getAzimuth(pnt2, center);
    const endAngle = Utils.getAzimuth(pnt3, center);
    const res = Utils.getArcPoints(center, radius, startAngle, endAngle);
    res.push(center, res[0]);

    const temp = [].concat(...res);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
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

  getPoints() {
    return this.points;
  }
}
