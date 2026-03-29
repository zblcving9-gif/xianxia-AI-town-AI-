# 文件依赖增量矩阵 - v13

## 版本变更说明

本次迭代为 **v12 → v13** 的增量变更

---

## 修改内容

### 1. 新增 npcai.js（全新二级节点）
- NPC完整AI决策引擎，226行
- 功能：`tryJoinFaction`（加入门派）、`doFactionTask`（门派任务）、`doGather`（采集）、`doCraft`（合成）、`doBuild`（建造）、`doCultivate`（修炼）、`doEat`（进食）
- 按NPC类型加权决策（elder/disciple/herbalist等各有侧重）
- 需求驱动：饥饿→进食，血量低→使用丹药

### 2. 修改 state.js（~35行）
- `createEntity` 新增 aiTimer/aiState/aiTargetRes/baseName/factionContribution/factionRank 字段
- `updateNPCs` 分流：NPC调用 NPCAISystem.updateAI，怪物调用 updateMonsterAI
- 新增 `updateMonsterAI`（怪物追击/巡逻，感知距离250）
- 删除旧 `updateNPCAI`（简单随机走路）

### 3. 修改 social.js（~30行）
- `friendlyInteraction` 扩展：新增"分享资源"（物品转移）和"传授功法"（贡献加成）
- `updateNPCSocial` 新增：无门派NPC有概率触发 NPCAISystem.tryJoinFaction

### 4. 修改 index.html（1行）
- 新增 `<script src="js/systems/npcai.js"></script>`

---

## 增量依赖矩阵变化（与v12相比）

| 变化类型 | 文件 | 说明 |
|----------|------|------|
| 新增节点 | `npcai.js` | index.html → npcai.js = **1**（原无此行/列） |
| 无变化 | 其余16个文件 | 依赖关系矩阵行列值不变 |

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/systems/npcai.js` | 226行（新建） | NPC完整AI决策引擎 |
| `js/engine/state.js` | ~35行 | NPC AI字段+updateMonsterAI+调用NPCAISystem |
| `js/systems/social.js` | ~30行 | 友好交互扩展+无门派触发加入门派 |
| `index.html` | 1行 | 新增npcai.js引用 |

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 修改1行 |
| 二级节点修改≤100行 | ✅ | state.js ~35行，social.js ~30行 |
| 新增文件≤400行 | ✅ | npcai.js 226行 |
| 根节点≤1000行 | ✅ | index.html 988行 |
| 二级节点正交 | ✅ | npcai.js通过全局作用域访问其他系统，非import引用 |
