// @ts-ignore
import * as CesiumTypeOnly from '@examples/cesium';

export type PolygonStyle = {
  fillColor?: CesiumTypeOnly.Color;
  outlineWidth?: number;
  outlineColor?: CesiumTypeOnly.Color;
};

export type LineStyle = {
  lineColor?: CesiumTypeOnly.Color;
  lineWidth?: number;
};

export type State = 'drawing' | 'edit' | 'static';
export type GeometryStyle = PolygonStyle | LineStyle;
