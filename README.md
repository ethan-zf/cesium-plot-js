# CesiumDraw
cesium绘制插件

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

### 类的实例方法

| 方法名      | 参数                                   | 描述     |
| ----------- | -------------------------------------- | -------- |
| hide        |                                        | 隐藏     |
| show        |                                        | 显示     |
| remove      |                                        | 删除     |
| addEvent    | (event: EventType, listener: Function) | 绑定事件 |
| removeEvent | (event: EventType)                     | 解绑事件 |


### 事件

- 'drawStart'

绘制开始

- 'drawUpdate'

绘制过程中点位更新

- 'drawEnd'

绘制结束

- 'editStart'

编辑开始

- 'editEnd'

编辑结束