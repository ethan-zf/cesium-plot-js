import Base from '../base';
// @ts-ignore
import { Cartesian3 } from '@examples/cesium';
import { PolygonStyle } from '../interface';

export default class FreehandLine extends Base {
  points: Cartesian3[] = [];
  type: 'polygon' | 'line';
  freehand: boolean;

  constructor(cesium: any, viewer: any, style: PolygonStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.type = 'line';
    this.freehand = true;
    this.setState('drawing');
  }

  /**
   * Add points only on click events
   */
  addPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    if (this.points.length < 2) {
      this.onMouseMove();
    } else {
      this.finishDrawing();
    }
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    this.setGeometryPoints(this.points);
    this.drawLine();
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    this.setGeometryPoints(this.points);
    this.drawLine();
  }

  getPoints() {
    return this.points;
  }
}
