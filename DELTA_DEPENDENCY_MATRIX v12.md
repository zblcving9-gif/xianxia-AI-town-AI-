# 文件依赖增量矩阵 - v12

## 版本变更说明

本次迭代为 **v11 → v12** 的增量变更

---

## 修改内容

### 1. 物理碰撞和边界
- 修改碰撞过滤设置，允许实体间碰撞
- 使用 `setVelocity` 替代 `setPosition` 实现物理碰撞
- 降低摩擦力和空气阻力

### 2. 多轮聊天和持久化
- 聊天记录保存到 localStorage
- 每个NPC保留最近20条聊天记录
- 显示历史对话摘要

### 3. NPC多功能系统
- NPC可执行：采集、修炼、休息
- 添加 `updateNPCBehavior` 行为系统
- NPC定时执行随机功能

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `js/engine/state.js` | ~30行 | 碰撞过滤、NPC行为系统 |
| `js/systems/dialog.js` | ~35行 | 多轮聊天、持久化 |

---

## 代码变更详情

### state.js - 碰撞和行为
```javascript
// 碰撞过滤 - 允许碰撞
collisionFilter: { category: 0x0001, mask: 0xFFFF }

// 使用物理速度移动
Core.setVelocity(p.body, { x: p.velocityX, y: p.velocityY });

// NPC行为系统
updateNPCBehavior(npc) {
    const actions = ['gather', 'cultivate', 'rest'];
    // 随机执行功能...
}
```

### dialog.js - 持久化聊天
```javascript
// 聊天记录持久化
getAllChatHistory() { return JSON.parse(localStorage.getItem('npc_chat_history') || '{}'); }
saveChatHistory(npcId, history) { localStorage.setItem('npc_chat_history', JSON.stringify(all)); }
```

---

## 符合迭代规则验证

| 规则 | 状态 | 说明 |
|------|------|------|
| 根节点修改≤50行 | ✅ | index.html 未修改 |
| 二级节点修改≤100行 | ✅ | state.js ~30行, dialog.js ~35行 |
| 文件行数≤400行 | ✅ | 全部符合 |
