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

  constructor(cesium, viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
    this.tailWidthFactor = 0.1;
    this.neckWidthFactor = 0.2;
    this.headWidthFactor = 0.25;
    this.headAngle = Math.PI / 8.5;
    this.neckAngle = Math.PI / 13;
  }

  onClick(callback?: Function) {
    // 添加点击事件监听器
    this.eventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.clickListener = this.eventHandler.setInputAction((evt) => {
      const ray = this.viewer.camera.getPickRay(evt.position);
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      callback && callback(cartesian);
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  removeEventListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_CLICK, this.clickListener);
  }

  onMove() {}

  addToMap(positions) {
    const callback = () => {
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
      debugger;
      return new this.cesium.PolygonHierarchy(cartesianPoints);
    };
    return this.viewer.entities.add({
      polygon: new this.cesium.PolygonGraphics({
        hierarchy: new this.cesium.CallbackProperty(callback, false),
        show: true,
        // fill: true,
        // material: this.cesium.Color.LIGHTSKYBLUE.withAlpha(0.8),
      }),
    });
  }

  cartesianToLnglat(cartesian) {
    var lnglat = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    var lat = this.cesium.Math.toDegrees(lnglat.latitude);
    var lng = this.cesium.Math.toDegrees(lnglat.longitude);
    return [lng, lat];
  }
}
