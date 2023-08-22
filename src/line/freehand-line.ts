import Draw from '../draw';
import { Cartesian3 } from '@examples/cesium';

export default class FreehandLine extends Draw {
  points: Cartesian3[] = [];
  type: 'polygon' | 'line';
  freehand: boolean;

  constructor(cesium: any, viewer: any, style: any) {
    super(cesium, viewer);
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
