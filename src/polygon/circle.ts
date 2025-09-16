import Base from '../base';
import * as Utils from '../utils';
// @ts-ignore
import { Cartesian3 } from 'cesium';

import { PolygonStyle } from '../interface';

export default class Circle extends Base {
  points: Cartesian3[] = [];
  freehand: boolean;
  radius: number = 0; // 添加半径属性
  radiusLabelEntity: any; // 添加半径标签实体

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
   * 计算标签位置（圆心到右侧圆边的中间位置）
   */
  calculateLabelPosition(): Cartesian3 {
    if (this.points.length < 1) {
      return this.points[0];
    }

    const centerCartesian = this.points[0];
    
    // 计算局部坐标系（东-北-上）
    const localFrame = this.cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);
    
    // 提取东向单位向量（右侧方向）
    const eastVector = this.cesium.Cartesian3.fromElements(
      localFrame[0],
      localFrame[1],
      localFrame[2],
      new this.cesium.Cartesian3(),
    );
    
    // 归一化方向向量
    this.cesium.Cartesian3.normalize(eastVector, eastVector);
    
    // 计算半径的一半距离的偏移量（向右）
    const halfRadiusOffset = this.cesium.Cartesian3.multiplyByScalar(
      eastVector,
      this.radius / 2, // 半径的一半
      new this.cesium.Cartesian3(),
    );
    
    // 计算标签位置（圆心 + 向右偏移半径的一半）
    const labelPosition = this.cesium.Cartesian3.add(
      centerCartesian,
      halfRadiusOffset,
      new this.cesium.Cartesian3(),
    );
    
    // 投影到椭球表面
    const surfacePosition = this.cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(
      labelPosition,
      new this.cesium.Cartesian3(),
    );
    
    return surfacePosition || labelPosition;
  }

  /**
   * 创建或更新半径标签
   */
  createRadiusLabel() {
    if (this.points.length >= 1 && this.radius > 0) {
      const labelPosition = this.calculateLabelPosition();
      const radiusText = this.formatRadiusText(this.radius);
      
      if (!this.radiusLabelEntity) {
        this.radiusLabelEntity = this.dataSource.entities.add({
          position: labelPosition,
          label: {
            text: radiusText,
            font: '16pt sans-serif',
            fillColor: this.cesium.Color.WHITE,
            outlineColor: this.cesium.Color.BLACK,
            outlineWidth: 2,
            style: this.cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new this.cesium.Cartesian2(0, 0),
            horizontalOrigin: this.cesium.HorizontalOrigin.CENTER,
            verticalOrigin: this.cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: this.cesium.HeightReference.CLAMP_TO_GROUND
          }
        });
      } else {
        // 更新现有标签的文本和位置
        this.radiusLabelEntity.position = labelPosition;
        this.radiusLabelEntity.label.text = radiusText;
      }
    }
  }

  /**
   * 更新半径标签位置（专门用于拖动时的位置更新）
   */
  updateRadiusLabelPosition() {
    if (this.radiusLabelEntity && this.points.length >= 1 && this.radius > 0) {
      const labelPosition = this.calculateLabelPosition();
      this.radiusLabelEntity.position = labelPosition;
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
    this.updateRadiusLabel(); // 更新半径标签
  }

  /**
   * In edit mode, drag key points to update corresponding key point data.
   */
  updateDraggingPoint(cartesian: Cartesian3, index: number) {
    this.points[index] = cartesian;
    const geometryPoints = this.createGraphic(this.points);
    this.setGeometryPoints(geometryPoints);
    this.drawPolygon();
    this.updateRadiusLabel(); // 更新半径标签
    this.updateRadiusLabelPosition(); // 确保标签位置跟随圆心
  }

  createGraphic(positions: Cartesian3[]) {
    const lnglatPoints = positions.map((pnt) => {
      return this.cartesianToLnglat(pnt);
    });
    const center = lnglatPoints[0];
    const pnt2 = lnglatPoints[1];

    const radius = Utils.MathDistance(center, pnt2);
    this.radius = radius; // 保存半径数据

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
    this.radius = radius; // 保存半径数据（米为单位）
    
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

  /**
   * 获取圆的半径
   * @returns {number} 半径值（米）
   */
  getRadius(): number {
    return this.radius;
  }

  /**
   * 设置圆的半径
   * @param {number} radius 半径值（米）
   */
  setRadius(radius: number): void {
    this.radius = radius;
  }

  /**
   * 获取圆的直径
   * @returns {number} 直径值（米）
   */
  getDiameter(): number {
    return this.radius * 2;
  }

  /**
   * 获取圆的面积
   * @returns {number} 面积值（平方米）
   */
  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  /**
   * 获取圆的周长
   * @returns {number} 周长值（米）
   */
  getCircumference(): number {
    return 2 * Math.PI * this.radius;
  }

  /**
   * 更新半径标签
   */
  updateRadiusLabel() {
    if (this.points.length >= 1 && this.radius > 0) {
      this.createRadiusLabel();
    }
  }

  /**
   * 格式化半径文本显示
   */
  formatRadiusText(radius: number): string {
    if (radius >= 1000) {
      return `半径: ${(radius / 1000).toFixed(2)} km`;
    } else {
      return `半径: ${radius.toFixed(2)} m`;
    }
  }

  /**
   * 重写drawPolygon方法，添加半径标签显示
   */
  drawPolygon() {
    super.drawPolygon();
    this.updateRadiusLabel();
  }

  /**
   * 重写draggable方法，确保拖动时标签跟随移动
   */
  draggable() {
    super.draggable();
    
    // 监听拖动事件，确保标签位置实时更新
    if (this.dragEventHandler) {
      const originalMouseMoveHandler = this.dragEventHandler.getInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
      
      this.dragEventHandler.setInputAction((event) => {
        if (originalMouseMoveHandler) {
          originalMouseMoveHandler(event);
        }
        // 在拖动过程中实时更新标签位置
        this.updateRadiusLabelPosition();
      }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
  }

  /**
   * 重写remove方法，确保移除半径标签
   */
  remove() {
    if (this.radiusLabelEntity) {
      this.dataSource.entities.remove(this.radiusLabelEntity);
      this.radiusLabelEntity = null;
    }
    super.remove();
  }

  /**
   * 显示/隐藏半径标签
   */
  showRadiusLabel(show: boolean = true) {
    if (this.radiusLabelEntity) {
      this.radiusLabelEntity.label.show = show;
    }
  }
}
