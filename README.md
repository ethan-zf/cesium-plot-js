# cesium-plot-js

cesium 军事标绘插件,支持绘制多边形、曲线、箭头等图形

![image](https://ethan-zf.github.io/cesium-plot-js/examples/plot.png)

[在线示例：demo](https://ethan-zf.github.io/cesium-plot-js/examples/index.html)


### CDN

1. 引入文件

```
<script src="https://unpkg.com/cesium-plot-js"></script>
```
2. 调用绘制api

```
  new CesiumPlot.FineArrow(Cesium, viewer);
```

### NPM

1. install

```
npm i cesium-plot-js
```

2. import

```
import CesiumPlot from 'cesium-plot-js';
```

3. 调用绘制api

```
  new CesiumPlot.FineArrow(Cesium, viewer);
```

### Class

每个图形为独立的类，绑定事件或其他操作通过类的实例来实现

| 类名                   | 类型      | 描述             |
| ---------------------- | --------- | ---------------- |
| Polygon                | 'polygon' | 多边形           |
| Reactangle             | 'polygon' | 矩形             |
| Triangle               | 'polygon' | 三角形           |
| Circle                 | 'polygon' | 圆形             |
| StraightArrow          | 'line'    | 细直箭头         |
| CurvedArrow            | 'line'    | 曲线箭头         |
| FineArrow              | 'polygon' | 直箭头           |
| AttackArrow            | 'polygon' | 进攻方向箭头     |
| SwallowtailAttackArrow | 'polygon' | 燕尾进攻方向箭头 |
| SquadCombat            | 'polygon' | 分队战斗方向     |
| SwallowtailSquadCombat | 'polygon' | 燕尾分队战斗方向 |
| AssaultDirection       | 'polygon' | 突击方向         |
| DoubleArrow            | 'polygon' | 双箭头           |
| FreehandLine           | 'line'    | 自由线           |
| FreehandPolygon        | 'polygon' | 自由面           |
| Curve                  | 'line'    | 曲线             |
| Ellipse                | 'polygon' | 椭圆             |
| Lune                   | 'polygon' | 半月面           |

### 构造函数

所有图形的构造函数：

<类名>(cesium: Cesium, viewer: Cesium.Viewer, style?: [PolygonStyle](#PolygonStyle) | [LineStyle](#LineStyle))

<h4 id='PolygonStyle'>PolygonStyle类型</h4>

```
{
  material?: Cesium.MaterialProperty;
  outlineWidth?: number;
  outlineMaterial?: Cesium.MaterialProperty;
};
```

<h4 id='LineStyle'>LineStyle类型</h4>

```
{
  material?: Cesium.Color;
  lineWidth?: number;
};
```

示例

```
// 初始化viewer
const viewer = new Cesium.Viewer('cesiumContainer');
// 抗锯齿
viewer.scene.postProcessStages.fxaa.enabled = true;
// 设置自定义样式
const geometry = new CesiumPlot.FineArrow(Cesium, viewer, {
  material: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 0.5)'),
  outlineMaterial: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 1)'),
  outlineWidth: 3,
});
```

### 类的实例方法

| 方法名 | 参数                                                    | 描述     |
| ------ | ------------------------------------------------------- | -------- |
| hide   |                                                         | 隐藏     |
| show   |                                                         | 显示     |
| remove |                                                         | 删除     |
| on     | (event: EventType, listener: (eventData?: any) => void) | 绑定事件 |
| off    | (event: EventType)                                      | 解绑事件 |

```
// 隐藏图形
const geometry = new CesiumPlot.Reactangle(Cesium, viewer);
geometry.hide();
```

```
// 绑定事件
const geometry = new CesiumPlot.Reactangle(Cesium, viewer);
geometry.on('drawEnd', (data)=>{
  console.log(data)
});
```

### Events

- 'drawStart'

绘制开始

- 'drawUpdate'

绘制过程中点位更新，回调事件返回更新的 Cartesian3 点位

- 'drawEnd'

绘制结束，回调事件返回图形的关键点位

```
geometry.on('drawEnd', (data) => {
  console.log(data);
});
```

- 'editStart'

编辑开始

- 'editEnd'

编辑结束，回调事件返回图形的关键点位
