// @ts-ignore
import * as CesiumTypeOnly from 'cesium';

export type PolygonStyle = {
  material?: CesiumTypeOnly.MaterialProperty;
  outlineWidth?: number;
  outlineMaterial?: CesiumTypeOnly.MaterialProperty;
};

export type LineStyle = {
  material?: CesiumTypeOnly.Color;
  lineWidth?: number;
};

export type State = 'drawing' | 'edit' | 'static' | 'animating';
export type GeometryStyle = PolygonStyle | LineStyle;

export type EventType = 'drawStart' | 'drawUpdate' | 'drawEnd' | 'editEnd' | 'editStart';
export type EventListener = (eventData?: any) => void;

export type VisibleAnimationOpts = {
  duration?: number;
  delay?: number;
  callback?: () => void;
};

export type GrowthAnimationOpts = {
  duration: number;
  delay: number;
  callback: Function;
};
