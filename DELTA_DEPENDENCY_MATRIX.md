# 文件依赖增量矩阵 - v10

## 版本变更说明

本次迭代为 **v9 → v10** 的增量变更

---

## 优化内容

### 实现恒定移动速度

**问题描述**：
- 玩家移动速度仍然太慢
- 多处代码会修改速度值
- 疾病、效果、体力等都会影响速度

**解决方案**：
- 速度固定为常量 `MOVE_SPEED = 8`
- 移除所有速度修改代码
- 直接计算位置，不依赖物理引擎速度

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/engine/state.js` | ~15行 | 恒定速度、移除速度效果 |
| `js/systems/survival.js` | ~10行 | 移除疾病速度影响 |
| `js/systems/combat.js` | ~3行 | 移除轻功速度修改 |

---

## 代码变更详情

### state.js - 恒定速度
```javascript
// 恒定速度，不受任何因素影响
const MOVE_SPEED = 8;

// 直接计算新位置
const moveX = vx * MOVE_SPEED;
const moveY = vy * MOVE_SPEED;
const newX = p.x + moveX;
const newY = p.y + moveY;
Core.setPosition(p.body, { x: newX, y: newY });

// effects不再修改速度
if (e.type === 'boost_speed') // 不再修改速度
```

### survival.js - 移除疾病速度影响
```javascript
case 'cold':
    // 感冒：降低体力恢复（不影响移动速度）
    break;

// cure()不再修改速度
```

### combat.js - 移除轻功速度修改
```javascript
movementSkill(skill) {
    // 速度恒定，不再动态修改
    Game.showMessage(`轻功施展！`);
}
```

---

## 速度对比

| 场景 | 修改前 | 修改后 |
|------|--------|--------|
| 正常移动 | 5 | **8** |
| 感冒生病 | 3.35 | **8** |
| 加速效果 | 6.65 | **8** |
| 体力耗尽 | 2.5~5 | **8** |

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 未修改 |
| 二级节点修改≤100行 | ✅ | 合计 ~28行 |
| 文件行数≤400行 | ✅ | 全部符合 |
