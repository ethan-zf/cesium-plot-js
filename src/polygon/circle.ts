import Base from '../base';
import * as Utils from '../utils';
// @ts-ignore
import { Cartesian3 } from 'cesium';

import { PolygonStyle } from '../interface';

export default class Circle extends Base {
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
    } else if (this.points.length > 1) {
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
    const center = lnglatPoints[0];
    const pnt2 = lnglatPoints[1];

    const radius = Utils.MathDistance(center, pnt2);

    const res = this.generatePoints(positions);
    const temp = [].concat(...res);
    const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }
  generatePoints(positions) {
    const points = [];
    const degreesPerRadian = 180.0 / Math.PI;

    // 验证输入格式
    if (!positions || positions.length !== 2) {
      console.error('输入参数格式错误，需要包含两个世界坐标点');
      return points;
    }
    // 提取中心点和第二点（均为Cartesian3世界坐标）
    const centerCartesian = positions[0];
    const secondPointCartesian = positions[1];

    // 计算两点之间的距离作为半径（米）
    const radius = this.cesium.Cartesian3.distance(centerCartesian, secondPointCartesian);
    // 计算局部坐标系（东-北-上）
    const localFrame = this.cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);
    // 提取东向和北向单位向量
    const eastVector = this.cesium.Cartesian3.fromElements(
      localFrame[0],
      localFrame[1],
      localFrame[2],
      new this.cesium.Cartesian3(),
    );
    const northVector = this.cesium.Cartesian3.fromElements(
      localFrame[4],
      localFrame[5],
      localFrame[6],
      new this.cesium.Cartesian3(),
    );

    // 归一化方向向量
    this.cesium.Cartesian3.normalize(eastVector, eastVector);
    this.cesium.Cartesian3.normalize(northVector, northVector);

    // 生成圆周点
    for (let i = 0; i <= 100; i++) {
      const angle = (Math.PI * 2 * i) / 100;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // 计算偏移量（基于米）
      const eastOffset = this.cesium.Cartesian3.multiplyByScalar(
        eastVector,
        radius * cosAngle,
        new this.cesium.Cartesian3(),
      );
      const northOffset = this.cesium.Cartesian3.multiplyByScalar(
        northVector,
        radius * sinAngle,
        new this.cesium.Cartesian3(),
      );

      // 计算目标点
      const targetPoint = this.cesium.Cartesian3.add(
        centerCartesian,
        this.cesium.Cartesian3.add(eastOffset, northOffset, new this.cesium.Cartesian3()),
        new this.cesium.Cartesian3(),
      );

      // 投影到椭球表面
      const surfacePoint = this.cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(
        targetPoint,
        new this.cesium.Cartesian3(),
      );

      // 转换回经纬度
      const cartographic = this.cesium.Cartographic.fromCartesian(surfacePoint);
      const longitude = cartographic.longitude * degreesPerRadian;
      const latitude = cartographic.latitude * degreesPerRadian;

      points.push([longitude, latitude]);
    }
    return points;
  }
  getPoints() {
    return this.points;
  }
}
