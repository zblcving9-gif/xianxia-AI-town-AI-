# 文件依赖增量矩阵 - v4

## 版本变更说明

本次迭代为 **v3 → v4** 的增量变更

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/engine/state.js` | ~95行 | NPC/怪物完整属性+随机好感度 |
| `js/engine/renderer.js` | ~20行 | 怪物渲染样式 |

---

## 新增功能详情

### 1. NPC/怪物完整属性

**新增属性列表**：

| 属性类型 | 新增属性 |
|----------|----------|
| 能量系统 | mana, stamina, hunger, immunity, spiritualPower |
| 修仙系统 | cultivation, cultivationLevel, cultivationRealm, cultivationSpeed |
| 物品系统 | inventory, gold, techniques |
| 战斗系统 | attackSpeed, attackRange, defense |

### 2. 怪物系统

**创建内容**：
- 5只妖兽怪物
- 随机分布在地图中
- 独特外观（棕色身体+红眼）
- 更高的攻击力和速度

### 3. 好感度随机化

```
relationship: Math.floor(Math.random() * 201) - 100
// 范围：-100 到 +100
```

**好感度分布**：
| 好感度范围 | 态度 | 行为 |
|------------|------|------|
| -100 ~ -50 | 敌对 | 主动攻击玩家 |
| -49 ~ -20 | 冷淡 | 不愿交流 |
| -19 ~ 20 | 中立 | 正常交互 |
| 21 ~ 50 | 友善 | 热情回应 |
| 51 ~ 100 | 挚友 | 任务奖励加成 |

---

## 代码变更详情

### state.js 新增 createEntity 方法

```javascript
createEntity(name, x, y, type, factionName, id, isMonster) {
    // 创建拥有完整属性的NPC或怪物
}
```

### renderer.js 怪物渲染

```javascript
if (npc.isMonster) {
    // 怪物特殊渲染：棕色身体、红色眼睛
}
```

---

## 增量矩阵

**v3 → v4 变化矩阵:** 无依赖变化

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | 根节点未修改 |
| 二级节点修改≤100行 | ✅ | state.js ~95行, renderer.js ~20行 |
| 文件总行数≤400行 | ✅ | state.js 240行, renderer.js 312行 |
