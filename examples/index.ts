import CesiumPlot from "../src";
import * as Cesium from "./cesium/index";

let raster = new Cesium.ArcGisMapServerImageryProvider({
  url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
});
const viewer = new Cesium.Viewer("cesiumContainer", {
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
  destination: Cesium.Cartesian3.fromDegrees(107.857, 35.594498, 8000000),
});

document.getElementById("drawStraightArrow").onclick = () => {
  new CesiumPlot.FineArrow(Cesium, viewer, {});
};
