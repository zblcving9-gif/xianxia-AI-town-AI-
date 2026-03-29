# 修仙AI小镇 - 文件依赖关系矩阵 v7

## 版本信息
- **版本号**: v7
- **更新日期**: 2024年迭代版本
- **变更说明**: 
  - 修复玩家速度系统冲突问题
  - 统一使用baseSpeed替代硬编码速度值
  - 添加速度下限保护机制

## 项目文件列表

| 序号 | 文件路径 | 节点级别 | 行数 | 说明 |
|------|----------|----------|------|------|
| 1 | `index.html` | 根节点 | 886 | 主入口文件 |
| 2 | `js/engine/core.js` | 二级节点 | 245 | 物理引擎核心 |
| 3 | `js/engine/renderer.js` | 二级节点 | 391 | 渲染系统 |
| 4 | `js/engine/state.js` | 二级节点 | 292 | 游戏状态管理 |
| 5 | `js/systems/building.js` | 二级节点 | 251 | 建造系统 |
| 6 | `js/systems/resource.js` | 二级节点 | 161 | 资源采集 |
| 7 | `js/systems/combat.js` | 二级节点 | 127 | 战斗系统 |
| 8 | `js/systems/faction.js` | 二级节点 | 279 | 门派系统 |
| 9 | `js/systems/weather.js` | 二级节点 | 188 | 天气系统 |
| 10 | `js/systems/dialog.js` | 二级节点 | 169 | NPC对话 |
| 11 | `js/systems/cultivation.js` | 二级节点 | 249 | 修炼系统 |
| 12 | `js/systems/crafting.js` | 二级节点 | 286 | 合成系统 |
| 13 | `js/systems/social.js` | 二级节点 | 251 | NPC社交 |
| 14 | `js/systems/survival.js` | 二级节点 | 286 | 生存系统 |
| 15 | `js/systems/spiritual.js` | 二级节点 | 207 | 灵力系统 |
| 16 | `js/systems/technique.js` | 二级节点 | 123 | 功法快捷栏 |

**总计：16个文件**

---

## 有向依赖矩阵 (16×16)

```
         1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
         ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓
    1 → [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
   2-16 → [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

---

## 符合原则验证

| 原则 | 状态 | 说明 |
|------|------|------|
| ✅ 单入口点 | 通过 | 只有 `index.html` 是主入口 |
| ✅ 二级节点正交 | 通过 | 所有二级节点文件互不引用 |
| ✅ 单向引用 | 通过 | 只有 `index.html` 引用二级节点 |
| ✅ 最大三级深度 | 通过 | 项目结构为二级深度 |
| ✅ 根节点≤1000行 | 通过 | `index.html` 886行 |
| ✅ 二级节点≤400行 | 通过 | 最大文件 renderer.js 391行 |

---

## 运行时全局对象依赖

| 全局对象 | 定义位置 | 被使用位置 |
|----------|----------|------------|
| `Game` | index.html | 所有系统 |
| `GameActions` | index.html | UI交互 |
| `Core` | core.js | state.js, technique.js |
| `GameState` | state.js | 所有系统 |
| `GameData` | state.js | technique.js, crafting.js等 |
| `QuickBarSystem` | technique.js | index.html |
| `CombatSystem` | combat.js | technique.js, state.js |
| ... | ... | ... |
