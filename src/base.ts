// @ts-ignore
import * as CesiumTypeOnly from 'cesium';
import {
  State,
  GeometryStyle,
  PolygonStyle,
  LineStyle,
  EventType,
  EventListener,
  VisibleAnimationOpts,
  GrowthAnimationOpts,
} from './interface';
import EventDispatcher from './events';
import cloneDeep from 'lodash.clonedeep';
// import merge from 'lodash.merge';
import * as Utils from './utils';

export default class Base {
  cesium: typeof CesiumTypeOnly;
  viewer: CesiumTypeOnly.Viewer;
  eventHandler: CesiumTypeOnly.ScreenSpaceEventHandler;
  polygonEntity: CesiumTypeOnly.Entity;
  geometryPoints: CesiumTypeOnly.Cartesian3[] = [];
  state: State = 'drawing';
  controlPoints: CesiumTypeOnly.EntityCollection = [];
  controlPointsEventHandler: CesiumTypeOnly.ScreenSpaceEventHandler;
  lineEntity: CesiumTypeOnly.Entity;
  type!: 'polygon' | 'line';
  freehand!: boolean;
  style: GeometryStyle | undefined;
  outlineEntity: CesiumTypeOnly.Entity;
  eventDispatcher: EventDispatcher;
  dragEventHandler: CesiumTypeOnly.ScreenSpaceEventHandler;
  entityId: string = '';
  points: CesiumTypeOnly.Cartesian3[] = [];
  styleCache: GeometryStyle | undefined;
  minPointsForShape: number = 0;
  tempLineEntity: CesiumTypeOnly.Entity;

  constructor(cesium: CesiumTypeOnly, viewer: CesiumTypeOnly.Viewer, style?: GeometryStyle) {
    this.cesium = cesium;
    this.viewer = viewer;
    this.type = this.getType();

    this.mergeStyle(style);
    this.cartesianToLnglat = this.cartesianToLnglat.bind(this);
    this.pixelToCartesian = this.pixelToCartesian.bind(this);
    this.eventDispatcher = new EventDispatcher();
    // Disable default behavior for double-clicking on entities.
    viewer.trackedEntity = undefined;
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    this.onClick();
  }

  mergeStyle(style: GeometryStyle | undefined) {
    if (this.type === 'polygon') {
      this.style = Object.assign(
        {
          material: new this.cesium.Color(),
          outlineMaterial: new this.cesium.Color(),
          outlineWidth: 2,
        },
        style,
      );
    } else if (this.type === 'line') {
      this.style = Object.assign(
        {
          material: new this.cesium.Color(),
          lineWidth: 2,
        },
        style,
      );
    }
    //Cache the initial settings to avoid modification of properties due to reference type assignment.
    this.styleCache = cloneDeep(this.style);
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
    this.eventHandler.setInputAction((evt: any) => {
      const pickedObject = this.viewer.scene.pick(evt.position);
      const hitEntities = this.cesium.defined(pickedObject) && pickedObject.id instanceof this.cesium.Entity;
      let activeEntity = this.polygonEntity;
      if (this.type === 'line') {
        activeEntity = this.lineEntity;
      }

      if (this.state === 'drawing') {
        // In the drawing state, the points clicked are key nodes of the shape, and they are saved in this.points.
        const cartesian = this.pixelToCartesian(evt.position);
        const points = this.getPoints();
        // If the click is outside the sphere, position information cannot be obtained.
        if (!cartesian) {
          return;
        }

        // "For non-freehand drawn shapes, validate that the distance between two consecutive clicks is greater than 10 meters
        if (!this.freehand && points.length > 0 && !this.checkDistance(cartesian, points[points.length - 1])) {
          return;
        }
        this.addPoint(cartesian);

        // Trigger 'drawStart' when the first point is being drawn.
        if (this.getPoints().length === 1) {
          this.eventDispatcher.dispatchEvent('drawStart');
        }
        this.eventDispatcher.dispatchEvent('drawUpdate', cartesian);
      } else if (this.state === 'edit') {
        //In edit mode, exit the editing state and delete control points when clicking outside the currently edited shape.
        if (!hitEntities || activeEntity.id !== pickedObject.id.id) {
          this.setState('static');
          this.removeControlPoints();
          this.disableDrag();
          // Trigger 'drawEnd' and return the geometry shape points when exiting the edit mode.
          this.eventDispatcher.dispatchEvent('editEnd', this.getPoints());
        }
      } else if (this.state === 'static') {
        //When drawing multiple shapes, the click events for all shapes are triggered. Only when hitting a completed shape should it enter editing mode.
        if (hitEntities && activeEntity.id === pickedObject.id.id) {
          const pickedGraphics = this.type === 'line' ? pickedObject.id.polyline : pickedObject.id.polygon;
          if (this.cesium.defined(pickedGraphics)) {
            // Hit Geometry Shape.
            this.setState('edit');
            this.addControlPoints();
            this.draggable();
            this.eventDispatcher.dispatchEvent('editStart');
          }
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  onMouseMove() {
    this.eventHandler.setInputAction((evt: any) => {
      const points = this.getPoints();
      const cartesian = this.pixelToCartesian(evt.endPosition);
      if (!cartesian) {
        return;
      }
      if (this.checkDistance(cartesian, points[points.length - 1])) {
        // Synchronize data to subclasses.If the distance is less than 10 meters, do not proceed
        this.updateMovingPoint(cartesian, points.length);
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  onDoubleClick() {
    this.eventHandler.setInputAction((evt: any) => {
      if (this.state === 'drawing') {
        this.finishDrawing();
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  /**
   * Check if the distance between two points is greater than 10 meters.
   */
  checkDistance(cartesian1: CesiumTypeOnly.Cartesian3, cartesian2: CesiumTypeOnly.Cartesian3) {
    const distance = this.cesium.Cartesian3.distance(cartesian1, cartesian2);
    return distance > 10;
  }

  finishDrawing() {
    // Some polygons draw a separate line between the first two points before drawing the complete shape;
    // this line should be removed after drawing is complete.
    this.type === 'polygon' && this.lineEntity && this.viewer.entities.remove(this.lineEntity);

    this.removeMoveListener();
    // Editable upon initial drawing completion.
    this.setState('edit');
    this.addControlPoints();
    this.draggable();
    const entity = this.polygonEntity || this.lineEntity;
    this.entityId = entity.id;
    /**
     * "I've noticed that CallbackProperty can lead to significant performance issues.
     *  After drawing multiple shapes, the map becomes noticeably laggy. Using methods
     * like requestAnimationFrame or setInterval doesn't provide a smooth way to display
     *  shapes during the drawing process. As a temporary solution, I've set the hierarchy
     *  or positions to static after drawing is complete. This addresses the performance
     *  problem, but introduces a new issue: after setting the data to static, the shapes
     *  redraw, resulting in a flicker. However, this seems to be a relatively reasonable
     *  approach given the current circumstances."
     */
    // TODO...
    // if (this.type === 'polygon') {
    //   this.polygonEntity.polygon.hierarchy = new this.cesium.PolygonHierarchy(this.geometryPoints);
    //   this.outlineEntity.polyline.positions = [...this.geometryPoints, this.geometryPoints[0]];
    // } else if (this.type === 'line') {
    //   this.lineEntity.polyline.positions = this.geometryPoints;
    // }

    this.eventDispatcher.dispatchEvent('drawEnd', this.getPoints());
  }

  removeClickListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  removeMoveListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  removeDoubleClickListener() {
    this.eventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  setGeometryPoints(geometryPoints: CesiumTypeOnly.Cartesian3[]) {
    this.geometryPoints = geometryPoints;
  }

  getGeometryPoints(): CesiumTypeOnly.Cartesian3[] {
    return this.geometryPoints;
  }

  drawPolygon() {
    const callback = () => {
      return new this.cesium.PolygonHierarchy(this.geometryPoints);
    };
    if (!this.polygonEntity) {
      const style = this.style as PolygonStyle;
      this.polygonEntity = this.viewer.entities.add({
        polygon: new this.cesium.PolygonGraphics({
          hierarchy: new this.cesium.CallbackProperty(callback, false),
          show: true,
          material: style.material,
        }),
      });

      // Due to limitations in PolygonGraphics outlining, a separate line style is drawn.
      this.outlineEntity = this.viewer.entities.add({
        polyline: {
          positions: new this.cesium.CallbackProperty(() => {
            return [...this.geometryPoints, this.geometryPoints[0]];
          }, false),
          width: style.outlineWidth,
          material: style.outlineMaterial,
          clampToGround: true,
        },
      });
    }
  }

  drawLine() {
    if (!this.lineEntity) {
      const style = this.style as LineStyle;
      this.lineEntity = this.addLineEntity(style);
    }
  }

  addTempLine() {
    if (!this.tempLineEntity) {
      // The line style between the first two points matches the outline style.
      const style = this.style as PolygonStyle;
      const lineStyle = {
        material: style.outlineMaterial,
        lineWidth: style.outlineWidth,
      };
      this.tempLineEntity = this.addLineEntity(lineStyle);
    }
  }

  removeTempLine() {
    if (this.tempLineEntity) {
      this.viewer.entities.remove(this.tempLineEntity);
    }
  }

  addLineEntity(style: LineStyle) {
    const entity = this.viewer.entities.add({
      polyline: {
        positions: new this.cesium.CallbackProperty(() => this.geometryPoints, false),
        width: style.lineWidth,
        material: style.material,
        clampToGround: true,
      },
    });
    return entity;
  }

  cartesianToLnglat(cartesian: CesiumTypeOnly.Cartesian3): [number, number] {
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
      // return this.viewer.entities.add({
      //   position,
      //   billboard: {
      //     image: './src/assets/circle_red.png',
      //   },
      // });

      return this.viewer.entities.add({
        position,
        point: {
          pixelSize: 10,
          heightReference: this.cesium.HeightReference.CLAMP_TO_GROUND,
          color: this.cesium.Color.RED,
        },
      });
    });

    let isDragging = false;
    let draggedIcon: CesiumTypeOnly.Entity = null;
    let dragStartPosition: CesiumTypeOnly.Cartesian3;

    this.controlPointsEventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    // Listen for left mouse button press events
    this.controlPointsEventHandler.setInputAction((clickEvent: any) => {
      const pickedObject = this.viewer.scene.pick(clickEvent.position);

      if (this.cesium.defined(pickedObject)) {
        for (let i = 0; i < this.controlPoints.length; i++) {
          if (pickedObject.id === this.controlPoints[i]) {
            isDragging = true;
            draggedIcon = this.controlPoints[i];
            dragStartPosition = draggedIcon.position._value;
            //Save the index of dragged points for dynamic updates during movement
            draggedIcon.index = i;
            break;
          }
        }
        // Disable default camera interaction.
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Listen for mouse movement events
    this.controlPointsEventHandler.setInputAction((moveEvent: any) => {
      if (isDragging && draggedIcon) {
        const cartesian = this.viewer.camera.pickEllipsoid(moveEvent.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
          draggedIcon.position.setValue(cartesian);
          this.updateDraggingPoint(cartesian, draggedIcon.index);
        }
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Listen for left mouse button release events
    this.controlPointsEventHandler.setInputAction(() => {
      // Trigger 'drawUpdate' when there is a change in coordinates before and after dragging.
      if (draggedIcon && !this.cesium.Cartesian3.equals(dragStartPosition, draggedIcon.position._value)) {
        this.eventDispatcher.dispatchEvent('drawUpdate', draggedIcon.position._value);
      }
      isDragging = false;
      draggedIcon = null;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  removeControlPoints() {
    if (this.controlPoints.length > 0) {
      this.controlPoints.forEach((entity: CesiumTypeOnly.Entity) => {
        this.viewer.entities.remove(entity);
      });
      this.controlPointsEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_DOWN);
      this.controlPointsEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.controlPointsEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_UP);
    }
  }

  /**
   * Allow the entire shape to be dragged while in edit mode.
   */
  draggable() {
    let dragging = false;
    let startPosition: CesiumTypeOnly.Cartesian3 | undefined;
    this.dragEventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.dragEventHandler.setInputAction((event: any) => {
      const pickRay = this.viewer.scene.camera.getPickRay(event.position);
      if (pickRay) {
        const cartesian = this.viewer.scene.globe.pick(pickRay, this.viewer.scene);
        const pickedObject = this.viewer.scene.pick(event.position);
        if (this.cesium.defined(pickedObject) && pickedObject.id instanceof this.cesium.Entity) {
          const clickedEntity = pickedObject.id;
          if (this.isCurrentEntity(clickedEntity.id)) {
            //Clicking on the current instance's entity initiates drag logic.
            dragging = true;
            startPosition = cartesian;
            this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          }
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);

    this.dragEventHandler.setInputAction((event: any) => {
      if (dragging && startPosition) {
        // Retrieve the world coordinates of the current mouse position.
        const newPosition = this.pixelToCartesian(event.endPosition);
        if (newPosition) {
          // Calculate the displacement vector.
          const translation = this.cesium.Cartesian3.subtract(newPosition, startPosition, new this.cesium.Cartesian3());
          const newPoints = this.geometryPoints.map((p) => {
            return this.cesium.Cartesian3.add(p, translation, new this.cesium.Cartesian3());
          });

          //Move all key points according to a vector.
          this.points = this.points.map((p) => {
            return this.cesium.Cartesian3.add(p, translation, new this.cesium.Cartesian3());
          });

          // Move control points in the same manner.
          this.controlPoints.map((p: CesiumTypeOnly.Entity) => {
            const position = p.position?.getValue(this.cesium.JulianDate.now());
            const newPosition = this.cesium.Cartesian3.add(position, translation, new this.cesium.Cartesian3());
            p.position?.setValue(newPosition);
          });

          this.setGeometryPoints(newPoints);
          if (this.minPointsForShape === 4) {
            // 双箭头在整体被拖拽时，需要同步更新生长动画的插值点
            this.curveControlPointLeft = this.cesium.Cartesian3.add(this.curveControlPointLeft, translation, new this.cesium.Cartesian3());
            this.curveControlPointRight = this.cesium.Cartesian3.add(this.curveControlPointRight, translation, new this.cesium.Cartesian3());
          }
          startPosition = newPosition;
        }
      } else {
        const pickRay = this.viewer.scene.camera.getPickRay(event.endPosition);
        if (pickRay) {
          const pickedObject = this.viewer.scene.pick(event.endPosition);
          if (this.cesium.defined(pickedObject) && pickedObject.id instanceof this.cesium.Entity) {
            const clickedEntity = pickedObject.id;
            // TODO 绘制的图形，需要特殊id标识，可在创建entity时指定id
            if (this.isCurrentEntity(clickedEntity.id)) {
              this.viewer.scene.canvas.style.cursor = 'move';
            } else {
              this.viewer.scene.canvas.style.cursor = 'default';
            }
          } else {
            this.viewer.scene.canvas.style.cursor = 'default';
          }
        }
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Listen for the mouse release event to end dragging.
    this.dragEventHandler.setInputAction(() => {
      dragging = false;
      startPosition = undefined;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  // Finish editing, disable dragging."
  disableDrag() {
    this.dragEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.dragEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.dragEventHandler.removeInputAction(this.cesium.ScreenSpaceEventType.LEFT_UP);
  }

  show(opts: VisibleAnimationOpts) {
    if (opts) {
      const { duration, delay, callback } = opts;
      this.showWithAnimation(duration, delay, callback);
      return;
    } else {
      this.showWithAnimation(0, 0);
    }
  }

  hide(opts: VisibleAnimationOpts) {
    if (opts) {
      const { duration, delay, callback } = opts;
      this.hideWithAnimation(duration, delay, callback);
      return;
    } else {
      this.hideWithAnimation(0, 0);
    }
  }

  showWithAnimation(duration: number = 2000, delay: number = 0, callback?: () => void) {
    if (this.state !== 'hidden') {
      //If not in a static state or already displayed, do not process.
      return;
    }
    this.setState('static');
    if (this.type === 'polygon') {
      let alpha = 0.3;
      const material = this.styleCache.material;
      if (material.image) {
        // With Texture
        alpha = material.color.getValue().alpha;
      } else {
        alpha = material.alpha;
      }

      this.animateOpacity(this.polygonEntity, alpha, duration, delay, callback, this.state);
      const outlineAlpha = this.styleCache?.outlineMaterial?.alpha;
      this.animateOpacity(this.outlineEntity, outlineAlpha || 1.0, duration, delay, undefined, this.state);
    } else if (this.type === 'line') {
      const material = this.styleCache.material;
      let alpha = 1.0;
      if (material.image) {
        // With Texture
        alpha = material.color.alpha;
      } else if (material.dashLength) {
        // Dashed Line
        const color = material.color.getValue();
        alpha = color.alpha;
      } else {
        // Solid Color
        alpha = this.styleCache?.material?.alpha;
      }
      this.animateOpacity(this.lineEntity, alpha, duration, delay, callback, this.state);
    }
    if (duration != 0) {
      this.setState('animating');
    }
  }

  hideWithAnimation(duration: number = 2000, delay: number = 0, callback?: () => void) {
    if (this.state === 'hidden' || this.state != 'static') {
      return;
    }
    this.setState('hidden');
    if (this.type === 'polygon') {
      this.animateOpacity(this.polygonEntity, 0.0, duration, delay, callback, this.state);
      this.animateOpacity(this.outlineEntity, 0.0, duration, delay, undefined, this.state);
    } else if (this.type === 'line') {
      this.animateOpacity(this.lineEntity, 0.0, duration, delay, callback, this.state);
    }
    // if (this.state == 'edit') {
    // 	this.controlPoints.forEach(p => {
    // 		this.animateOpacity(p, 0.0, duration, delay, undefined, this.state);
    // 	});
    // }
    if (duration != 0) {
      this.setState('animating');
    }
  }

  animateOpacity(
    entity: CesiumTypeOnly.Entity,
    targetAlpha: number,
    duration: number,
    delay: number,
    callback?: () => void,
    state?: State,
  ): void {
    setTimeout(() => {
      const graphics = entity.polygon || entity.polyline || entity.billboard;
      let startAlpha: number;
      let material = graphics.material;
      if (material) {
        if (material.image && material.color.alpha !== undefined) {
          // Texture material, setting the alpha channel in the color of the custom ImageFlowMaterialProperty.
          startAlpha = material.color.alpha;
        } else {
          startAlpha = material.color.getValue().alpha;
        }
      } else {
        // billbord
        const color = graphics.color.getValue();
        startAlpha = color.alpha;
      }

      let startTime = 0;

      const animate = (currentTime: number) => {
        if (!startTime) {
          startTime = currentTime;
        }
        const elapsedTime = currentTime - startTime;

        if (elapsedTime < duration) {
          const deltalpha = (elapsedTime / duration) * (targetAlpha - startAlpha);
          const newAlpha = startAlpha + deltalpha;

          if (material) {
            if (material.image && material.color.alpha !== undefined) {
              // Texture Material
              material.color.alpha = newAlpha;
            } else {
              // Solid Color
              const newColor = material.color.getValue().withAlpha(newAlpha);
              material.color.setValue(newColor);
            }
          } else {
            // billbord
            const color = graphics.color.getValue();
            const newColor = color.withAlpha(newAlpha);
            graphics.color.setValue(newColor);
          }

          requestAnimationFrame(animate);
        } else {
          // Animation Ended
          callback && callback();
          const restoredState = state ? state : 'static';

          // if (targetAlpha === 0) {
          //   this.setState('hidden');
          // }

          // if (duration == 0) {
          // this.setState('drawing');
          if (material) {
            if (material.image && material.color.alpha !== undefined) {
              // Texture Material
              material.color.alpha = targetAlpha;
            } else {
              // Solid Color
              const newColor = material.color.getValue().withAlpha(targetAlpha);
              material.color.setValue(newColor);
            }
          } else {
            // billbord
            const color = graphics.color.getValue();
            const newColor = color.withAlpha(targetAlpha);
            graphics.color.setValue(newColor);
          }
          requestAnimationFrame(() => {
            this.setState(restoredState);
          });
          // } else {
          // 	this.setState(restoredState);
          // }
        }
      };

      requestAnimationFrame(animate);
    }, delay);
  }

  startGrowthAnimation(opts: GrowthAnimationOpts) {
    const { duration = 2000, delay = 0, callback } = opts || {};
    if (this.state === 'hidden' || this.state != 'static') {
      return;
    }
    if (!this.minPointsForShape) {
      console.warn('Growth animation is not supported for this type of shape');
      return;
    }
    this.setState('animating');
    if (this.minPointsForShape === 4) {
      // For double arrows, special handling is required.
      this.doubleArrowGrowthAnimation(duration, delay, callback);
      return;
    }
    setTimeout(() => {
      this.hideWithAnimation(0, 0, undefined);
      const points = this.getPoints();

      let segmentDuration = 0;
      if (this.minPointsForShape === 2) {
        segmentDuration = duration / (points.length - 1);
      } else {
        segmentDuration = duration / (points.length - 2);
      }

      let startTime = Date.now();
      let movingPointIndex = 0;
      this.viewer.clock.shouldAnimate = true;

      const frameListener = (clock) => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= duration) {
          // Animation ends
          callback && callback();
          startTime = 0;
          this.viewer.clock.shouldAnimate = false;
          this.viewer.clock.onTick.removeEventListener(frameListener);
          this.setState('static');
          return;
        }

        const currentSegment = Math.floor(elapsedTime / segmentDuration);
        let startPoint;

        if (this.minPointsForShape === 2) {
          movingPointIndex = currentSegment + 1;
        } else {
          movingPointIndex = currentSegment + 2;
        }
        startPoint = points[movingPointIndex - 1];
        if (currentSegment == 0 && this.minPointsForShape === 3) {
          // The face-arrow determined by three points, with the animation starting from the midpoint of the line connecting the first two points.
          startPoint = this.cesium.Cartesian3.midpoint(points[0], points[1], new this.cesium.Cartesian3());
        }
        let endPoint = points[movingPointIndex];
        // To dynamically add points between the startPoint and endPoint, consistent with the initial drawing logic,
        // update the point at index movingPointIndex in the points array with the newPosition,
        // generate the arrow, and execute the animation.
        const t = (elapsedTime - currentSegment * segmentDuration) / segmentDuration;
        const newPosition = this.cesium.Cartesian3.lerp(startPoint, endPoint, t, new this.cesium.Cartesian3());
        const tempPoints = points.slice(0, movingPointIndex + 1);
        tempPoints[tempPoints.length - 1] = newPosition;
        const geometryPoints = this.createGraphic(tempPoints);
        this.setGeometryPoints(geometryPoints);
        this.showWithAnimation(0, 0, undefined);
      };
      this.viewer.clock.onTick.addEventListener(frameListener);
    }, delay);
  }

  private doubleArrowGrowthAnimation(duration: number = 2000, delay: number = 0, callback?: Function) {
    setTimeout(() => {
      this.hideWithAnimation(0, 0, undefined);
      const points = this.getPoints();
      let startTime = Date.now();
      this.viewer.clock.shouldAnimate = true;

      const frameListener = (clock) => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= duration) {
          // Animation ends
          callback && callback();
          startTime = 0;
          this.viewer.clock.shouldAnimate = false;
          this.viewer.clock.onTick.removeEventListener(frameListener);
          this.setState('static');
          return;
        }

        // Utils.isClockWise(pnt1, pnt2, pnt3)
        const midPoint = this.cesium.Cartesian3.midpoint(points[0], points[1], new this.cesium.Cartesian3());

        const startPointLeft = this.cesium.Cartesian3.midpoint(points[0], midPoint, new this.cesium.Cartesian3());

        const startPointRight = this.cesium.Cartesian3.midpoint(midPoint, points[1], new this.cesium.Cartesian3());
        let endPointLeft = points[3];
        let endPointRight = points[2];
        const t = elapsedTime / duration;
        const controlPoint = this.getBezierControlPointforGrowthAnimation();
        let curveControlPointsLeft = [startPointLeft, controlPoint.left, endPointLeft];
        let curveControlPointsRight = [startPointRight, controlPoint.right, endPointRight];
        const newPositionLeft = this.getNewPosition(curveControlPointsLeft, t);
        const newPositionRight = this.getNewPosition(curveControlPointsRight, t);

        // Assist in viewing exercise routes
        // this.viewer.entities.add({
        // 	position: newPositionLeft,
        // 	point: {
        // 		pixelSize: 4,
        // 		heightReference: this.cesium.HeightReference.CLAMP_TO_GROUND,
        // 		color: this.cesium.Color.RED,
        // 	},
        // });
        // this.viewer.entities.add({
        // 	position: newPositionRight,
        // 	point: {
        // 		pixelSize: 4,
        // 		heightReference: this.cesium.HeightReference.CLAMP_TO_GROUND,
        // 		color: this.cesium.Color.RED,
        // 	},
        // });
        const tempPoints = [...points];
        tempPoints[2] = newPositionRight;
        tempPoints[3] = newPositionLeft;
        const geometryPoints = this.createGraphic(tempPoints);
        this.setGeometryPoints(geometryPoints);
        this.showWithAnimation(0, 0, undefined);
      };
      this.viewer.clock.onTick.addEventListener(frameListener);
    }, delay);
  }

  private getNewPosition(curveControlPoints, t) {
    curveControlPoints = curveControlPoints.map((item) => {
      return this.cartesianToLnglat(item);
    });
    let curvePoints = Utils.getCurvePoints(0.3, curveControlPoints);
    curvePoints = curvePoints.map((p) => {
      return this.cesium.Cartesian3.fromDegrees(p[0], p[1]);
    });

    let newPosition = this.interpolateAlongCurve(curvePoints, t);
    return newPosition;
  }

  private interpolateAlongCurve(curvePoints, t) {
    const numPoints = curvePoints.length - 1;
    const index = Math.floor(t * numPoints);
    const tSegment = t * numPoints - index;
    const startPoint = curvePoints[index];
    const endPoint = curvePoints[index + 1];
    const x = startPoint.x + (endPoint.x - startPoint.x) * tSegment;
    const y = startPoint.y + (endPoint.y - startPoint.y) * tSegment;
    const z = startPoint.z + (endPoint.z - startPoint.z) * tSegment;

    return new this.cesium.Cartesian3(x, y, z);
  }

  remove() {
    if (this.type === 'polygon') {
      this.viewer.entities.remove(this.polygonEntity);
      this.viewer.entities.remove(this.outlineEntity);
      this.polygonEntity = null;
      this.outlineEntity = null;
      this.lineEntity = null;
    } else if (this.type === 'line') {
      this.viewer.entities.remove(this.lineEntity);
    }
    this.removeClickListener();
    this.removeMoveListener();
    this.removeDoubleClickListener();
    this.removeControlPoints();
  }

  on(eventType: EventType, listener: EventListener) {
    this.eventDispatcher.on(eventType, listener);
  }

  off(eventType: EventType, listener: EventListener) {
    this.eventDispatcher.off(eventType, listener);
  }

  isCurrentEntity(id: string) {
    // return this.entityId === `CesiumPlot-${id}`;
    return this.entityId === id;
  }

  addPoint(cartesian: CesiumTypeOnly.Cartesian3) {
    //Abstract method that must be implemented by subclasses.
  }

  getPoints(): CesiumTypeOnly.Cartesian3[] {
    //Abstract method that must be implemented by subclasses.
    return [new this.cesium.Cartesian3()];
  }

  updateMovingPoint(cartesian: CesiumTypeOnly.Cartesian3, index?: number) {
    //Abstract method that must be implemented by subclasses.
  }

  updateDraggingPoint(cartesian: CesiumTypeOnly.Cartesian3, index: number) {
    //Abstract method that must be implemented by subclasses.
  }

  getType(): 'polygon' | 'line' {
    return 'polygon';
    //Abstract method that must be implemented by subclasses.
  }

  createGraphic(points: CesiumTypeOnly.Cartesian3[]): CesiumTypeOnly.Cartesian3[] {
    //Abstract method that must be implemented by subclasses.
    return points;
  }
}
