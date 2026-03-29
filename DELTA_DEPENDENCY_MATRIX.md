# 文件依赖增量矩阵 - v5

## 版本变更说明

本次迭代为 **v4 → v5** 的增量变更

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/systems/combat.js` | ~8行 | 修复怪物死亡不消失、速度恢复逻辑 |
| `js/systems/survival.js` | ~5行 | 修复速度恢复逻辑 |
| `js/engine/state.js` | ~1行 | 添加baseSpeed属性 |
| `index.html` | ~30行 | 添加拾取物品功能 |

---

## Bug修复详情

### Bug 1: NPC/怪物死亡不消失
**原因**: `onDeath` 只检查 `target.isNPC`，怪物是 `isMonster: true` 且 `isNPC: false`
**修复**: 移除 `if (target.isNPC)` 条件，直接移除所有目标

### Bug 2: 无法拾取地面物品
**原因**: 没有拾取掉落物品的逻辑
**修复**: 在 `interact()` 中添加对 `droppedItems` 的检查和拾取

### Bug 3: 玩家速度变慢
**原因**: `movementSkill` 和 `updateSickness` 使用硬编码速度值，互相冲突
**修复**: 
- 添加 `baseSpeed` 属性
- 速度技能使用 `baseSpeed * 2`
- 恢复时使用 `baseSpeed`

---

## 代码变更对比

### combat.js
```
原: if (target.isNPC) { ... removeBody ... splice ... }
新: // 直接移除，不区分NPC/怪物
    if (target.body) Core.removeBody(target.body);
    const idx = GameState.npcs.indexOf(target);
    if (idx !== -1) GameState.npcs.splice(idx, 1);

原: player.speed = 6; setTimeout(() => player.speed = 3, 3000);
新: player.speed = baseSpeed * 2; setTimeout(() => player.speed = baseSpeed, 3000);
```

### index.html
```
新增: 检查 droppedItems 并拾取
      if (nearest.lifetime !== undefined) {
          // 拾取掉落物品
          GameState.addItem(player, nearest);
          GameState.droppedItems.splice(idx, 1);
      }
```

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html ~30行 |
| 二级节点修改≤100行 | ✅ | combat.js ~8行, survival.js ~5行, state.js ~1行 |
