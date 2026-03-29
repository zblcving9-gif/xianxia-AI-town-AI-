# 文件依赖增量矩阵 - v8

## 版本变更说明

本次迭代为 **v7 → v8** 的增量变更

---

## Bug修复

### 物理碰撞导致玩家卡住问题

**问题描述**：
- 玩家与NPC/怪物重叠时会被物理引擎卡住
- 多个怪物重叠时玩家无法穿过
- 物理摩擦力过大导致移动困难

**修复方案**：
1. 添加碰撞过滤，使玩家和NPC/怪物不发生物理碰撞
2. 强制位置更新，确保玩家移动流畅
3. 降低摩擦力参数

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/engine/state.js` | ~15行 | 碰撞过滤、强制位置更新 |

---

## 代码变更详情

### state.js - 碰撞过滤

```javascript
// 玩家创建时添加碰撞过滤
this.player.body = Core.createCircle(this.player.x, this.player.y, this.player.size, { 
    label: 'player', frictionAir: 0.5, friction: 0.1,
    collisionFilter: { group: -1, category: 0x0001, mask: 0x0002 }
});

// NPC/怪物创建时添加碰撞过滤
entity.body = Core.createCircle(x, y, entity.size, { 
    label: `${isMonster ? 'monster' : 'npc'}_${id}`, 
    frictionAir: 0.8, friction: 0.1,
    collisionFilter: { group: -1, category: 0x0001, mask: 0x0002 }
});

// 玩家移动时强制位置更新
if (p.body) {
    Core.setVelocity(p.body, { x: p.velocityX, y: p.velocityY });
    // 强制设置位置，避免被其他物理体卡住
    const targetX = p.x + p.velocityX * dt * 10;
    const targetY = p.y + p.velocityY * dt * 10;
    if (len > 0) {
        Core.setPosition(p.body, { x: targetX, y: targetY });
    }
    p.x = p.body.position.x; p.y = p.body.position.y;
}
```

---

## 碰撞过滤说明

| 参数 | 值 | 说明 |
|------|-----|------|
| `group` | -1 | 相同group不碰撞 |
| `category` | 0x0001 | 碰撞类别 |
| `mask` | 0x0002 | 只与墙壁碰撞 |

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 未修改 |
| 二级节点修改≤100行 | ✅ | state.js ~15行 |
| 文件行数≤400行 | ✅ | state.js 308行 |
