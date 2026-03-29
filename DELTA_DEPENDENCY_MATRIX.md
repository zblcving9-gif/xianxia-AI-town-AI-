# 文件依赖增量矩阵 - v6

## 版本变更说明

本次迭代为 **v5 → v6** 的增量变更

---

## 新增功能

### 1. 门派功法系统
- 4个门派各6个独特功法（共24个）
- 每个门派有不同的功法特色：
  - 青云门：雷法攻击
  - 药王谷：治疗与毒
  - 天音宗：音波控制
  - 万剑宗：剑气斩击

### 2. 快捷栏系统
- 3个快捷栏槽位（按键1/2/3）
- 功法冷却机制
- 法力消耗显示

### 3. 功法投射物系统
- 投射物朝鼠标方向发射
- 不同功法类型的视觉特效
- 碰撞检测与伤害计算

---

## 修改文件列表

| 文件 | 修改内容 | 说明 |
|------|----------|------|
| `js/engine/state.js` | 新增功法数据、projectiles数组 | 24个门派功法定义 |
| `js/engine/renderer.js` | 新增renderProjectiles方法 | 功法特效渲染 |
| `js/systems/technique.js` | 新建文件 | 快捷栏系统 |
| `index.html` | 快捷栏UI、按键绑定 | 1/2/3键使用功法 |

---

## 代码变更详情

### state.js - 功法数据
```javascript
// 新增24个门派功法
techniques: [
    // 青云门 - 雷法系
    { id: 'qingyun_thunder', name: '青云雷法', type: 'combat', power: 2, ... },
    // 药王谷 - 治疗/毒系
    { id: 'yaowang_heal', name: '回春术', type: 'healing', power: 2, ... },
    // 天音宗 - 音波控制系
    { id: 'tianyin_wave', name: '音波功', type: 'combat', power: 1.8, ... },
    // 万剑宗 - 剑气系
    { id: 'wanjian_blade', name: '剑气斩', type: 'combat', power: 2.2, ... },
    ...
]

// 新增投射物数组
projectiles: []
```

### renderer.js - 功法特效
```javascript
renderProjectiles(state) {
    // 雷电特效
    case 'lightning': ctx.strokeStyle = '#88aaff'; ...
    // 剑气特效
    case 'blade': ctx.fillStyle = '#ffdd44'; ...
    // 音波特效
    case 'wave': ctx.strokeStyle = '#ffaaff'; ...
}
```

### technique.js - 快捷栏
```javascript
const QuickBarSystem = {
    slots: [null, null, null],
    cooldowns: [0, 0, 0],
    use(index) { ... },
    fireProjectile(tech, player, angle) { ... }
}
```

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 新增约40行 |
| 二级节点修改≤100行 | ✅ | 各文件修改均在限制内 |
| 新建文件≤400行 | ✅ | technique.js 123行 |

---

## 功法类型说明

| 类型 | 效果 | 代表功法 |
|------|------|----------|
| combat | 发射投射物攻击 | 青云雷法、剑气斩 |
| healing | 恢复生命值 | 回春术、群体回春 |
| defense | 获得护盾 | 雷光护盾、剑气护体 |
| movement | 瞬移移动 | 雷遁术 |
| control | 眩晕敌人 | 定魂音、摄魂魔音 |
| ultimate | 全属性提升 | 剑神降临 |
