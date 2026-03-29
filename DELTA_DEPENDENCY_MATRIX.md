# 文件依赖增量矩阵 - v12

## 版本变更说明

本次迭代为 **v11 → v12** 的增量变更

---

## 修改内容

### 1. 物理碰撞分类重构
- 实体原来：`{ group: -1, category: 0x0001, mask: 0x0002 }` （仅与墙碰撞，实体互不碰撞）
- 实体现在：`{ category: 0x0001, mask: 0x0001|0x0002|0x0004 }` （与实体/墙/资源均碰撞）
- 边界墙：`{ category: 0x0002, mask: 0x0001 }`
- 资源物理体：`{ category: 0x0004, mask: 0x0001 }`

### 2. 资源节点物理体
- 树木(tree)和石头(rock)添加静态圆形物理体
- 资源耗尽时移除物理体；重生时恢复物理体

### 3. 实体移动改为物理驱动
- 玩家/NPC/怪物：setPosition → setVelocity，由Matter.js处理碰撞推挤

### 4. core.js 新增 createStaticCircle 方法

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/engine/core.js` | ~18行 | createStaticCircle、createStatic扩展、边界墙碰撞过滤器 |
| `js/engine/state.js` | ~35行 | 碰撞分类、资源物理体、velocity移动 |
| `js/systems/resource.js` | ~12行 | 耗尽移除body、重生恢复body |

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 未修改 |
| 二级节点修改≤100行 | ✅ | 三个文件合计~65行 |
| 文件行数≤400行 | ✅ | 所有文件均符合 |
| 根节点≤1000行 | ✅ | index.html 987行 |
