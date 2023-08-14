import * as Utils from './utils';
import * as CesiumTypeOnly from '../examples/cesium';
import { State } from './interface';

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
  geometryPoints: CesiumTypeOnly.Cartesian3[] = [];
  state: State = 'drawing';
  controlPoints: CesiumTypeOnly.EntityCollection;
  controlPointsEventHandler: CesiumTypeOnly.ScreenSpaceEventHandler;

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
    this.onClick();
  }

  /**
   * The base class provides a method to change the state, and different logic is implemented based on the state.
   *  The state is controlled by individual sub-components according to the actual situation.
   * @param state
   */
  setState(state: State) {
    this.state = state;
  }

  getState(): State {
    return this.state;
  }

  /**
   * Bind a global click event that responds differently based on the state. When in the drawing state,
   * a click will add points for geometric shapes. During editing, selecting a drawn shape puts it in an
   *  editable state. Clicking on empty space sets it to a static state.
   */
  onClick() {
    this.eventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.eventHandler.setInputAction((evt) => {
      const pickedObject = this.viewer.scene.pick(evt.position);
      const hitEntities = this.cesium.defined(pickedObject) && pickedObject.id instanceof CesiumTypeOnly.Entity;
      if (this.state === 'drawing') {
        // In the drawing state, the points clicked are key nodes of the shape, and they are saved in this.points.
        const cartesian = this.pixelToCartesian(evt.position);
        this.addPoint(cartesian);
      } else if (this.state === 'edit') {
        //In edit mode, exiting the edit state and deleting control points when clicking in the blank area.
        if (!hitEntities) {
          this.setState('static');
          this.removeControlPoints();
        }
      } else if (this.state === 'static') {
        if (hitEntities) {
          const pickedEntity = pickedObject.id;
          if (this.cesium.defined(pickedEntity.polygon)) {
            // Hit PolygonGraphics geometry.
            this.setState('edit');
            this.addControlPoints();
          }
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  onMouseMove() {
    this.eventHandler.setInputAction((evt) => {
      this.drawingWhileMoving(evt.endPosition, 1);
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  drawingWhileMoving(position: CesiumTypeOnly.Cartesian2, index: number) {
    const cartesian = this.pixelToCartesian(position);
    const lnglat = this.cartesianToLnglat(cartesian);
    const points = this.getPoints();
    const lastPoint = this.cartesianToLnglat(points[points.length - 1]);
    const distance = Utils.MathDistance(lnglat, lastPoint);
    if (distance < 0.0001) {
      return false;
    }
    // Synchronize data to subclasses.
    this.updateMovingPoint(cartesian, index);
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

  getGeometryPoints(): CesiumTypeOnly.Cartesian3[] {
    return this.geometryPoints;
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

  /**
   * Display key points when creating a shape, allowing dragging of these points to edit and generate new shapes.
   */
  addControlPoints() {
    const points = this.getPoints();
    this.controlPoints = points.map((position) => {
      return this.viewer.entities.add({
        position,
        billboard: {
          image: './src/assets/circle_red.png',
        },
      });
    });

    let isDragging = false;
    let draggedIcon: CesiumTypeOnly.Entity = null;

    this.controlPointsEventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // Listen for left mouse button press events
    this.controlPointsEventHandler.setInputAction((clickEvent) => {
      const pickedObject = this.viewer.scene.pick(clickEvent.position);

      if (this.cesium.defined(pickedObject)) {
        for (let i = 0; i < this.controlPoints.length; i++) {
          if (pickedObject.id === this.controlPoints[i]) {
            isDragging = true;
            draggedIcon = this.controlPoints[i];
            draggedIcon.index = i; //Save the index of dragged points for dynamic updates during movement
            break;
          }
        }
        // Disable default camera interaction.
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Listen for mouse movement events
    this.controlPointsEventHandler.setInputAction((moveEvent) => {
      if (isDragging && draggedIcon) {
        const cartesian = this.viewer.camera.pickEllipsoid(moveEvent.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
          draggedIcon.position.setValue(cartesian);
          this.drawingWhileMoving(moveEvent.endPosition, draggedIcon.index);
        }
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Listen for left mouse button release events
    this.controlPointsEventHandler.setInputAction(() => {
      isDragging = false;
      draggedIcon = null;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  removeControlPoints() {
    this.controlPoints.forEach((entity: CesiumTypeOnly.Entity) => {
      this.viewer.entities.remove(entity);
    });
    this.controlPointsEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.controlPointsEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.controlPointsEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  addPoint(cartesian: CesiumTypeOnly.Cartesian3) {
    //Abstract method that must be implemented by subclasses.
  }

  getPoints(): CesiumTypeOnly.Cartesian3[] {
    //Abstract method that must be implemented by subclasses.
    return this.cesium.Cartesian3();
  }

  updateMovingPoint(cartesian: CesiumTypeOnly.Cartesian3, index: number) {
    //Abstract method that must be implemented by subclasses.
  }
}
