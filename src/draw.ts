import * as Utils from './utils';
import * as CesiumTypeOnly from '../examples/cesium';

export default class Draw {
  cesium: typeof CesiumTypeOnly;
  viewer: CesiumTypeOnly.Viewer;
  arrowLengthScale: number = 5;
  maxArrowLength: number = 2;
  tailWidthFactor: number;
  neckWidthFactor: number;
  headWidthFactor: number;
  headAngle: number;
  neckAngle: number;
  eventHandler: CesiumTypeOnly.ScreenSpaceEventHandler;
  entity: CesiumTypeOnly.Entity;
  geometryPoints: CesiumTypeOnly.Cartesian3[] | undefined;

  constructor(cesium: typeof CesiumTypeOnly, viewer: CesiumTypeOnly.Viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
    this.tailWidthFactor = 0.1;
    this.neckWidthFactor = 0.2;
    this.headWidthFactor = 0.25;
    this.headAngle = Math.PI / 8.5;
    this.neckAngle = Math.PI / 13;
    this.cartesianToLnglat = this.cartesianToLnglat.bind(this);
    this.pixelToCartesian = this.pixelToCartesian.bind(this);
  }

  onClick() {
    this.eventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.eventHandler.setInputAction((evt) => {
      const cartesian = this.pixelToCartesian(evt.position);
      this.addPoint(cartesian);
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  onMouseMove() {
    this.eventHandler.setInputAction((evt) => {
      const cartesian = this.pixelToCartesian(evt.endPosition);
      const lnglat = this.cartesianToLnglat(cartesian);
      const lastPoint = this.cartesianToLnglat(this.points[this.points.length - 1]);
      const distance = Utils.MathDistance(lnglat, lastPoint);
      if (distance < 0.0001) {
        return false;
      }
      // Synchronize data to subclasses.
      this.updateMovingPoint(cartesian);
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  removeClickListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  removeMoveListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  setGeometryPoints(geometryPoints: CesiumTypeOnly.Cartesian3[]) {
    this.geometryPoints = geometryPoints;
  }

  addToMap() {
    const callback = () => {
      return new this.cesium.PolygonHierarchy(this.geometryPoints);
    };
    if (!this.entity) {
      this.entity = this.viewer.entities.add({
        polygon: new this.cesium.PolygonGraphics({
          hierarchy: new this.cesium.CallbackProperty(callback, false),
          show: true,
          // fill: true,
          // material: this.cesium.Color.LIGHTSKYBLUE.withAlpha(0.8),
        }),
      });
    }
  }

  cartesianToLnglat(cartesian: CesiumTypeOnly.Cartesian3): number[] {
    const lnglat = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    const lat = this.cesium.Math.toDegrees(lnglat.latitude);
    const lng = this.cesium.Math.toDegrees(lnglat.longitude);
    return [lng, lat];
  }

  pixelToCartesian(position: CesiumTypeOnly.Cartesian2): CesiumTypeOnly.Cartesian3 | undefined {
    const ray = this.viewer.camera.getPickRay(position);
    const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    return cartesian;
  }
}
