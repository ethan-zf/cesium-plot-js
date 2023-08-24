import CesiumPlot from '../src';
// import CesiumPlot from "../dist/CesiumPlot";
import * as Cesium from './cesium/index';

// let raster = new Cesium.ArcGisMapServerImageryProvider({
//   url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
// });

let raster = new Cesium.UrlTemplateImageryProvider({
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
  imageryProvider: raster,
  contextOptions: {
    requestWebgl2: true,
  },
  // msaaSamples: 4,
});

viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(107.857, 35.594498, 7000000),
});

const getCameraInfo = () => {
  var position = viewer.camera.position;
  var ellipsoid = viewer.scene.globe.ellipsoid;
  var cartographic = ellipsoid.cartesianToCartographic(position);
  var longitude = Cesium.Math.toDegrees(cartographic.longitude);
  var latitude = Cesium.Math.toDegrees(cartographic.latitude);
  console.error('camera position:', longitude, latitude);
  var position = viewer.camera.position;
  var ellipsoid = viewer.scene.globe.ellipsoid;
  var cartographic = ellipsoid.cartesianToCartographic(position);
  var height = cartographic.height;
  console.error('camera height:', height);
};

let geometry: any;
const buttonGroup = document.getElementById('button-group') as HTMLElement;
buttonGroup.onclick = (evt) => {
  const targetElement = evt.target as HTMLElement;
  switch (targetElement.id) {
    case 'drawFineArrow':
      geometry = new CesiumPlot.FineArrow(Cesium, viewer, {
        material: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 0.5)'),
        outlineMaterial: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 1)'),
        outlineWidth: 3,
      });
      break;
    case 'drawAttackArrow':
      geometry = new CesiumPlot.AttackArrow(Cesium, viewer, {
        outlineMaterial: Cesium.Color.RED,
      });
      break;
    case 'drawSwallowtailAttackArrow':
      geometry = new CesiumPlot.SwallowtailAttackArrow(Cesium, viewer, {
        outlineMaterial: Cesium.Color.BLUE,
      });
      break;
    case 'drawSquadCombat':
      geometry = new CesiumPlot.SquadCombat(Cesium, viewer, {
        outlineMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED,
          dashLength: 16.0,
        }),
      });
      break;
    case 'drawSwallowtailSquadCombat':
      geometry = new CesiumPlot.SwallowtailSquadCombat(Cesium, viewer);
      break;
    case 'drawStraightArrow':
      geometry = new CesiumPlot.StraightArrow(Cesium, viewer, {
        material: Cesium.Color.RED,
      });
      break;
    case 'drawAssaultDirection':
      geometry = new CesiumPlot.AssaultDirection(Cesium, viewer);
      break;
    case 'drawCurvedArrow':
      geometry = new CesiumPlot.CurvedArrow(Cesium, viewer, {
        material: Cesium.Color.BLUE,
      });
      break;
    case 'drawDoubleArrow':
      geometry = new CesiumPlot.DoubleArrow(Cesium, viewer, {
        outlineMaterial: Cesium.Color.GREEN,
      });
      break;
    case 'drawFreehandLine':
      geometry = new CesiumPlot.FreehandLine(Cesium, viewer);
      break;
    case 'drawFreehandPolygon':
      geometry = new CesiumPlot.FreehandPolygon(Cesium, viewer);
      break;
    case 'hide':
      geometry && geometry.hide();
      break;
    case 'show':
      geometry && geometry.show();
      break;
    case 'remove':
      geometry && geometry.remove();
      geometry = null;
      break;
    default:
      break;
  }
};
