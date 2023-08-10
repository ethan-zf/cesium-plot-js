import * as Utils from './utils';

export default class Draw {
  cesium: any;
  viewer: any;
  arrowLengthScale: number = 5;
  maxArrowLength: number = 2;
  tailWidthFactor: number;
  neckWidthFactor: number;
  headWidthFactor: number;
  headAngle: number;
  neckAngle: number;
  eventHandler: any;
  clickListener: any;
  entity: any;
  renderingPoints: any;
  geometryPoints: any;

  constructor(cesium, viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
    this.tailWidthFactor = 0.1;
    this.neckWidthFactor = 0.2;
    this.headWidthFactor = 0.25;
    this.headAngle = Math.PI / 8.5;
    this.neckAngle = Math.PI / 13;
  }

  onClick() {
    // 添加点击事件监听器
    this.eventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.clickListener = this.eventHandler.setInputAction((evt) => {
      const cartesian = this.pixelToCartesian(evt.position);
      this.addPoint(cartesian);
      this.onMouseMove();
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  removeEventListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_CLICK, this.clickListener);
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
      this.updateMovingPoint(cartesian);
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  setGeometryPoints(geometryPoints) {
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

  cartesianToLnglat(cartesian) {
    var lnglat = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    var lat = this.cesium.Math.toDegrees(lnglat.latitude);
    var lng = this.cesium.Math.toDegrees(lnglat.longitude);
    return [lng, lat];
  }

  pixelToCartesian(position) {
    const ray = this.viewer.camera.getPickRay(position);
    const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    return cartesian;
  }
}
