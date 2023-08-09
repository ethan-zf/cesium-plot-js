import Draw from '../draw';

export default class FineArrow extends Draw {
  points: any = [];
  constructor(cesium, viewer, style) {
    super(cesium, viewer);
    this.cesium = cesium;
    this.setPoints = this.setPoints.bind(this);
    this.onClick(this.setPoints);
  }

  setPoints(cartesian) {
    this.points.push(cartesian);
    if (this.points.length == 2) {
      this.addToMap(this.points);
      this.removeEventListener();
    }
  }
}
