// @ts-ignore
import * as CesiumTypeOnly from '@examples/cesium';

export type PolygonStyle = {
  material?: CesiumTypeOnly.MaterialProperty;
  outlineWidth?: number;
  outlineMaterial?: CesiumTypeOnly.MaterialProperty;
};

export type LineStyle = {
  material?: CesiumTypeOnly.Color;
  lineWidth?: number;
};

export type State = 'drawing' | 'edit' | 'static';
export type GeometryStyle = PolygonStyle | LineStyle;
