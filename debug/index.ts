import CesiumPlot from '../src';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
let raster = new Cesium.ArcGisMapServerImageryProvider({
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
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
});

viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(107.857, 35.594498, 10000),
});

let geometry: any;
let geometryType: string;
const dragStartHandler = () => {
  console.error('start');
};
const drawUpdateHandler = (cartesian: Cesium.Cartesian3) => {
  console.error('update', cartesian);
};

const drawEndHandler = (geometryPoints: any) => {
  console.error('drawEnd', geometryPoints);
};

const editStartHandler = () => {
  console.error('editStart');
};

const editEndHandler = (geometryPoints: any) => {
  console.error('editEnd', geometryPoints);
};

const buttonGroup = document.getElementById('button-group') as HTMLElement;
buttonGroup.onclick = (evt) => {
  const targetElement = evt.target as HTMLElement;
  geometryType = targetElement.id;
  geometry = new CesiumPlot[geometryType](Cesium, viewer, {
    material: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 0.5)'),
    outlineMaterial: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 1)'),
    outlineWidth: 3,
  });
};

const operationButtonGroup = document.getElementById('operation-button-group') as HTMLElement;
operationButtonGroup.onclick = (evt) => {
  const targetElement = evt.target as HTMLElement;
  switch (targetElement.id) {
    case 'hide':
      geometry &&
        geometry.hide({
          duration: 1000,
          delay: 0,
        });
      break;
    case 'show':
      geometry && geometry.show();
      break;
    case 'remove':
      geometry && geometry.remove();
      // geometry = null;
      break;
    case 'addEvent':
      if (geometry) {
        geometry.on('drawStart', dragStartHandler);
        geometry.on('drawUpdate', drawUpdateHandler);
        geometry.on('drawEnd', drawEndHandler);
        geometry.on('editStart', editStartHandler);
        geometry.on('editEnd', editEndHandler);
      }
      break;
    case 'removeEvent':
      if (geometry) {
        geometry.off('drawStart', dragStartHandler);
        geometry.off('drawUpdate', drawUpdateHandler);
        geometry.off('drawEnd', drawEndHandler);
        geometry.off('editStart', editStartHandler);
        geometry.off('editEnd', editEndHandler);
      }
      break;
    case 'startGrowthAnimation':
      if (geometry) {
        geometry.startGrowthAnimation();
      }
      break;
    case 'createGeometryFromData':
      if (geometry) {
        const points = geometry.getPoints();
        geometry = CesiumPlot.createGeometryFromData(Cesium, viewer, {
          type: geometryType,
          cartesianPoints: points,
        });
      }
      break;
    case 'cancelDraw':
      if (geometry) {
        geometry.remove();
      }
      break;
    default:
      break;
  }
};
