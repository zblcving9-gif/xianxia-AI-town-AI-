# 文件依赖增量矩阵 - v7

## 版本变更说明

本次迭代为 **v6 → v7** 的增量变更

---

## Bug修复

### 玩家速度系统冲突修复

**问题描述**：多个地方修改 `player.speed` 使用硬编码值，导致速度设置冲突，玩家可能无法移动。

**修复内容**：
1. 统一使用 `baseSpeed` 替代硬编码速度值
2. 添加速度下限保护机制

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/engine/state.js` | ~5行 | 添加速度保护，统一使用baseSpeed |
| `js/systems/survival.js` | ~3行 | 感冒速度和治愈速度使用baseSpeed |

---

## 代码变更详情

### state.js - 速度保护
```javascript
// 新增速度保护机制
updatePlayer(dt) {
    const p = this.player;
    // 速度保护：确保速度不会低于baseSpeed的30%
    const minSpeed = (p.baseSpeed || 3) * 0.3;
    if (p.speed < minSpeed) p.speed = p.baseSpeed || 3;
    ...
}

// 效果系统统一使用baseSpeed
if (e.type === 'boost_speed') entity.speed = (entity.baseSpeed || 3) * 1.33;
if (e.duration <= 0) { if (e.type === 'boost_speed') entity.speed = entity.baseSpeed || 3; }
```

### survival.js - 疾病速度
```javascript
// 感冒：降低速度33%（原来硬编码为2）
case 'cold':
    player.speed = player.baseSpeed * 0.67;
    break;

// 治愈：恢复baseSpeed（原来硬编码为3）
cure() {
    GameState.player.speed = GameState.player.baseSpeed || 3;
}
```

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 未修改 |
| 二级节点修改≤100行 | ✅ | state.js ~5行, survival.js ~3行 |

---

## 修复前后对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 加速效果结束 | speed = 3（硬编码） | speed = baseSpeed |
| 感冒生病 | speed = 2（硬编码） | speed = baseSpeed * 0.67 |
| 疾病痊愈 | speed = 3（硬编码） | speed = baseSpeed |
| 速度异常过低 | 无保护 | 自动恢复baseSpeed |
