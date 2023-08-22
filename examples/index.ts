import CesiumPlot from '../src';
// import CesiumPlot from "../dist/CesiumPlot";
import * as Cesium from './cesium/index';

// let raster = new Cesium.ArcGisMapServerImageryProvider({
//   url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
// });

let keda = new Cesium.UrlTemplateImageryProvider({
  url: 'https://10.68.8.41:9043/kmap-server/gridMap/tile/{z}/{y}/{x}',
  // url: 'http://10.68.8.58:8080/3d/dom2/{z}/{x}/{y}.png'
});
const viewer = new Cesium.Viewer('cesiumContainer', {
  animation: false,
  shouldAnimate: true,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  fullscreenButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false,
  baseLayerPicker: false,
  // imageryProvider: raster,
  imageryProvider: keda,
  contextOptions: {
    requestWebgl2: true,
  },
  // msaaSamples: 4,
});

viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(107.857, 35.594498, 7000000),
});

const buttonGroup = document.getElementById('button-group') as HTMLElement;
buttonGroup.onclick = (evt) => {
  const targetElement = evt.target as HTMLElement;
  switch (targetElement.id) {
    case 'drawFineArrow':
      new CesiumPlot.FineArrow(Cesium, viewer, {});
      break;
    case 'drawAttackArrow':
      new CesiumPlot.AttackArrow(Cesium, viewer, {});
      break;
    case 'drawSwallowtailAttackArrow':
      new CesiumPlot.SwallowtailAttackArrow(Cesium, viewer, {});
      break;
    case 'drawSquadCombat':
      new CesiumPlot.SquadCombat(Cesium, viewer, {});
      break;
    case 'drawSwallowtailSquadCombat':
      new CesiumPlot.SwallowtailSquadCombat(Cesium, viewer, {});
      break;
    case 'drawStraightArrow':
      new CesiumPlot.StraightArrow(Cesium, viewer, {});
      break;
    case 'drawAssaultDirection':
      new CesiumPlot.AssaultDirection(Cesium, viewer, {});
      break;
    case 'drawCurvedArrow':
      new CesiumPlot.CurvedArrow(Cesium, viewer, {});
      break;
    case 'drawDoubleArrow':
      new CesiumPlot.DoubleArrow(Cesium, viewer, {});
      break;
    case 'drawFreehandLine':
      new CesiumPlot.FreehandLine(Cesium, viewer, {});
      break;
    case 'drawFreehandPolygon':
      new CesiumPlot.FreehandPolygon(Cesium, viewer, {});
      break;

    default:
      break;
  }
};
