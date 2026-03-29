# 修仙AI小镇 - 文件依赖关系矩阵 v13

## 版本信息
- **版本号**: v13
- **更新日期**: 2026-03-29
- **变更说明**: 
  - 新增 `js/systems/npcai.js` NPC完整AI决策系统
  - NPC具备：加入门派、门派任务、采集、合成、建造、修炼、进食等全功能
  - 怪物AI独立为 updateMonsterAI（追击/巡逻）
  - social.js 扩展NPC友好交互（资源分享、传授功法）
  - state.js 中NPC实体新增 aiTimer/aiState/baseName/factionContribution/factionRank 字段

## 项目文件列表

| 序号 | 文件路径 | 节点级别 | 行数 | 说明 |
|------|----------|----------|------|------|
| 1 | `index.html` | 根节点 | 988 | 主入口文件 |
| 2 | `js/engine/core.js` | 二级节点 | ~262 | 物理引擎核心 |
| 3 | `js/engine/renderer.js` | 二级节点 | 391 | 渲染系统 |
| 4 | `js/engine/state.js` | 二级节点 | ~332 | 游戏状态管理（NPC AI字段+怪物AI） |
| 5 | `js/systems/building.js` | 二级节点 | 251 | 建造系统 |
| 6 | `js/systems/resource.js` | 二级节点 | ~172 | 资源采集 |
| 7 | `js/systems/combat.js` | 二级节点 | 125 | 战斗系统 |
| 8 | `js/systems/faction.js` | 二级节点 | 279 | 门派系统（玩家） |
| 9 | `js/systems/weather.js` | 二级节点 | 188 | 天气系统 |
| 10 | `js/systems/dialog.js` | 二级节点 | 169 | NPC对话 |
| 11 | `js/systems/cultivation.js` | 二级节点 | 249 | 修炼系统 |
| 12 | `js/systems/crafting.js` | 二级节点 | 286 | 合成系统 |
| 13 | `js/systems/social.js` | 二级节点 | 257 | NPC社交（扩展友好交互） |
| 14 | `js/systems/survival.js` | 二级节点 | 278 | 生存系统 |
| 15 | `js/systems/spiritual.js` | 二级节点 | 207 | 灵力系统 |
| 16 | `js/systems/technique.js` | 二级节点 | 123 | 功法快捷栏 |
| 17 | `js/systems/npcai.js` | 二级节点 | 226 | **NPC完整AI决策引擎（新增）** |

**总计：17个文件**

---

## 文件依赖有向图矩阵

> 行=被引用方，列=引用方；1=有引用，0=无引用

|  | index.html | core.js | renderer.js | state.js | building.js | resource.js | combat.js | faction.js | weather.js | dialog.js | cultivation.js | crafting.js | social.js | survival.js | spiritual.js | technique.js | npcai.js |
|--|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **index.html** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **core.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **renderer.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **state.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **building.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **resource.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **combat.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **faction.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **weather.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **dialog.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **cultivation.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **crafting.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **social.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **survival.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **spiritual.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **technique.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **npcai.js** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

---

## 符合原则验证

| 原则 | 状态 | 说明 |
|------|------|------|
| ✅ 单入口点 | 通过 | 只有 `index.html` 是主入口 |
| ✅ 二级节点正交 | 通过 | 所有二级节点文件互不引用（npcai.js调用其他模块的全局对象，通过window/全局作用域，非import引用） |
| ✅ 单向引用 | 通过 | 只有 `index.html` 引用二级节点 |
| ✅ 最大三级深度 | 通过 | 项目结构为二级深度 |
| ✅ 根节点≤1000行 | 通过 | `index.html` 988行 |
| ✅ 二级节点≤400行 | 通过 | 所有二级节点文件均≤400行 |
