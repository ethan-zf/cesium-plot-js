import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'cesium';
import { PolygonStyle } from '../interface';

export default class FreehandPolygon extends Base {
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
    } else if (this.points.length > 2) {
      this.finishDrawing();
    }
  }

  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    this.points.push(cartesian);
    if (this.points.length > 2) {
      this.setGeometryPoints(this.points);
      this.drawPolygon();
      this.eventDispatcher.dispatchEvent('drawUpdate', cartesian);
    }
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    this.setGeometryPoints(this.points);
    this.drawPolygon();
  }

  getPoints() {
    return this.points;
  }
}
