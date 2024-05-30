import Base from '../base';
import { Shape, TagStyle } from '../interface';
import { Cartesian3 } from 'cesium';

export default class Tag extends Base {
  points: Cartesian3[] = [];

  constructor(cesium: any, viewer: any, style?: TagStyle) {
    super(cesium, viewer, style);
    this.cesium = cesium;
    this.setState('drawing');
    this.onMouseMove();
  }
  getType(): Shape {
    return 'tag';
  }
  /**
   * Draw a shape based on mouse movement points during the initial drawing.
   */
  updateMovingPoint(cartesian: Cartesian3) {
    this.setGeometryPoints([cartesian]);
    this.drawTag();
  }

  onClick() {
    this.eventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.eventHandler.setInputAction((evt: any) => {
      const pickedObject = this.viewer.scene.pick(evt.position);
      const hitEntities = this.cesium.defined(pickedObject) && pickedObject.id instanceof this.cesium.Entity;
      const activeEntity = this.tagEntity;
      if (this.state === 'drawing') {
        this.finishDrawing();
      } else if (this.state === 'edit') {
        if (!hitEntities || activeEntity.id !== pickedObject.id.id) {
          this.tagEntity.billboard.image = this.style.image;
          this.setState('static');
          this.removeControlPoints();
          this.disableDrag();
          this.eventDispatcher.dispatchEvent('editEnd', this.getPoints());
        }
      } else if (this.state === 'static') {
        if (hitEntities && activeEntity.id === pickedObject.id.id) {
          this.tagEntity.billboard.image = this.style.activeImage;
          this.setState('edit');
          this.draggable();
          this.eventDispatcher.dispatchEvent('editStart');
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  draggable() {
    let dragging = false;
    this.dragEventHandler = new this.cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.dragEventHandler.setInputAction((event: any) => {
      const pickRay = this.viewer.scene.camera.getPickRay(event.position);
      if (pickRay) {
        const pickedObject = this.viewer.scene.pick(event.position);
        if (this.cesium.defined(pickedObject) && pickedObject.id instanceof this.cesium.Entity) {
          const clickedEntity = pickedObject.id;
          if (this.isCurrentEntity(clickedEntity.id)) {
            dragging = true;
            this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          }
        }
      }
    }, this.cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.dragEventHandler.setInputAction((event: any) => {
      if (dragging) {
        console.log(666, event);
        const cartesian = this.pixelToCartesian(event.endPosition);
        console.log(cartesian, this.state);
        this.tagEntity.position = cartesian;
      }
    }, this.cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.dragEventHandler.setInputAction(() => {
      dragging = false;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }, this.cesium.ScreenSpaceEventType.LEFT_UP);
  }
  /**
   * tag not need to add control points
   */
  addControlPoints() { }
}