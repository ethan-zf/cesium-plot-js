import * as Utils from '../utils';
import Base from '../base';
// @ts-ignore
import { Cartesian3 } from 'kmap-3d-engine';
import { LineStyle } from '../interface';

export default class Curve extends Base {
	points: Cartesian3[] = [];
	arrowLengthScale: number = 5;
	maxArrowLength: number = 3000000;
	t: number;

	constructor(cesium: any, viewer: any, style?: LineStyle) {
		super(cesium, viewer, style);
		this.cesium = cesium;
		this.t = 0.3;
		this.setState('drawing');
		this.onDoubleClick();
	}

	getType(): 'polygon' | 'line' {
		return 'line';
	}

	/**
	 * Points are only added upon click events.
	 */
	addPoint(cartesian: Cartesian3) {
		this.points.push(cartesian);
		if (this.points.length < 2) {
			this.onMouseMove();
		} else if (this.points.length === 2) {
			this.setGeometryPoints(this.points);
			this.drawLine();
		}
	}

	/**
	 * Draw the shape based on the mouse movement position during the initial drawing.
	 */
	updateMovingPoint(cartesian: Cartesian3) {
		const tempPoints = [...this.points, cartesian];
		let geometryPoints = [];
		if (tempPoints.length === 2) {
			this.setGeometryPoints(tempPoints);
			this.drawLine();
		} else {
			geometryPoints = this.createGraphic(tempPoints);
			this.setGeometryPoints(geometryPoints);
		}
	}

	/**
	 * During editing mode, drag key points to update the corresponding data.
	 */
	updateDraggingPoint(cartesian: Cartesian3, index: number) {
		this.points[index] = cartesian;
		const geometryPoints = this.createGraphic(this.points);
		this.setGeometryPoints(geometryPoints);
		this.drawLine();
	}

	/**
	 * Generate geometric shape points based on key points..
	 */
	createGraphic(positions: Cartesian3[]) {
		const lnglatPoints = positions.map(pnt => {
			return this.cartesianToLnglat(pnt);
		});

		const curvePoints = Utils.getCurvePoints(this.t, lnglatPoints);
		const temp = [].concat(...curvePoints);
		const cartesianPoints = this.cesium.Cartesian3.fromDegreesArray(temp);
		return cartesianPoints;
	}

	getPoints() {
		return this.points;
	}
}
