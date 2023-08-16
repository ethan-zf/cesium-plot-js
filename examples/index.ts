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
});

viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(107.857, 35.594498, 8000000),
});

const fineArrow = document.getElementById('drawFineArrow') as HTMLElement;
fineArrow.onclick = () => {
  new CesiumPlot.FineArrow(Cesium, viewer, {});
};

const attackArrow = document.getElementById('drawAttackArrow') as HTMLElement;
attackArrow.onclick = () => {
  new CesiumPlot.AttackArrow(Cesium, viewer, {});
};