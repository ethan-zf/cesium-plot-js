# CesiumDraw

cesium 绘制插件

![image](https://github.com/ethan-zf/CesiumDraw/assets/19545189/75b93c62-dd10-4c92-825c-c4ab01b454a7)

在线示例：[demo](https://ethan-zf.github.io/CesiumDraw/examples/index.html)

### 类

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

```
const geometry = new CesiumPlot.Polygon(Cesium, viewer);

```

### 类的实例方法

| 方法名 | 参数                                                    | 描述     |
| ------ | ------------------------------------------------------- | -------- |
| hide   |                                                         | 隐藏     |
| show   |                                                         | 显示     |
| remove |                                                         | 删除     |
| on     | (event: EventType, listener: (eventData?: any) => void) | 绑定事件 |
| off    | (event: EventType)                                      | 解绑事件 |

### 事件

- 'drawStart'

绘制开始

```
geometry.on('drawStart', () => {
  console.log('draw start');
});

```

- 'drawUpdate'

绘制过程中点位更新，回调事件返回更新的 Cartesian3 点位

```
geometry.on('drawUpdate', () => {
  console.log('draw start');
});

```

- 'drawEnd'

绘制结束，回调事件返回图形的关键点位

- 'editStart'

编辑开始

- 'editEnd'

编辑结束，回调事件返回图形的关键点位
