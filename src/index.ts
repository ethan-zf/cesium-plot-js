import FineArrow from './arrow/fine-arrow';
import AttackArrow from './arrow/attack-arrow';
import SwallowtailAttackArrow from './arrow/swallowtail-attack-arrow';
import SquadCombat from './arrow/squad-combat';
import SwallowtailSquadCombat from './arrow/swallowtail-squad-combat';
import StraightArrow from './arrow/straight-arrow';
import CurvedArrow from './arrow/curved-arrow';
import AssaultDirection from './arrow/assault-direction';
import DoubleArrow from './arrow/double-arrow';
import FreehandLine from './line/freehand-line';
import FreehandPolygon from './polygon/freehand-polygon';
import Curve from './line/curve';
import Ellipse from './polygon/ellipse';
import Lune from './polygon/lune';
import Reactangle from './polygon/rectangle';
import Triangle from './polygon/triangle';
import Polygon from './polygon/polygon';
import Circle from './polygon/circle';
import Sector from './polygon/sector';

import { GeometryStyle } from './interface';
import * as CesiumTypeOnly from 'cesium';

const CesiumPlot: any = {
  FineArrow,
  AttackArrow,
  SwallowtailAttackArrow,
  SquadCombat,
  SwallowtailSquadCombat,
  StraightArrow,
  CurvedArrow,
  AssaultDirection,
  DoubleArrow,
  FreehandLine,
  FreehandPolygon,
  Curve,
  Ellipse,
  Lune,
  Reactangle,
  Triangle,
  Polygon,
  Circle,
  Sector,
};

type CreateGeometryFromDataOpts = {
  type: string;
  cartesianPoints: CesiumTypeOnly.Cartesian3[];
  style: GeometryStyle;
};
/**
 * 根据点位数据生成几何图形
 * @param points
 */
CesiumPlot.createGeometryFromData = (cesium: any, viewer: any, opts: CreateGeometryFromDataOpts) => {
  const { type, style, cartesianPoints } = opts;
  const geometry = new CesiumPlot[type](cesium, viewer, style);

  geometry.points = cartesianPoints;
  const geometryPoints = geometry.createGraphic(cartesianPoints);
  geometry.setGeometryPoints(geometryPoints);
  if (geometry.type == 'polygon') {
    geometry.drawPolygon();
  } else {
    geometry.drawLine();
  }
  geometry.finishDrawing();
  geometry.onClick();
  return geometry;
};

export default CesiumPlot;
