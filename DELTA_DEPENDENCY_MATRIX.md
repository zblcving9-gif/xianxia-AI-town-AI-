# 文件依赖增量矩阵 - v2

## 版本变更说明

本次迭代为 **v1 → v2** 的增量变更

---

## 修改文件列表

| 文件 | 修改行数 | 修改内容 |
|------|----------|----------|
| `index.html` | ~6行 | 修复资源采集判断条件 |
| `js/systems/dialog.js` | ~45行 | 添加API Key配置、实现真实Qwen API调用 |

---

## 新增依赖关系

| 源文件 | 目标文件 | 类型 | 说明 |
|--------|----------|------|------|
| 无新增 | - | - | 依赖关系未变化 |

---

## 删除依赖关系

| 源文件 | 目标文件 | 说明 |
|--------|----------|------|
| 无删除 | - | - |

---

## 文件变更详情

### 1. index.html (根节点)
```
变更类型: 修改
变更行数: 约6行
变更位置: GameActions.interact() 函数

原代码:
    } else if (nearest.type === 'resource') {
        ResourceSystem.gather(nearest);
    }

新代码:
    } else if (nearest.amount !== undefined) {
        // 是资源（有amount属性）
        ResourceSystem.gather(nearest);
    }
```

### 2. js/systems/dialog.js (二级节点)
```
变更类型: 修改
变更行数: 约45行
变更位置: 多处

新增内容:
1. 添加 apiKey 属性，支持localStorage持久化
2. 新增 showApiSettings() 方法 - 显示API配置面板
3. 新增 saveApiKey() 方法 - 保存API Key
4. 重写 callQwenAPI() 方法 - 实现真实的qwen-turbo调用
   - 使用 dashscope.aliyuncs.com/compatible-mode/v1/chat/completions 接口
   - 支持动态API Key配置
```

---

## 增量矩阵

**v1 → v2 变化矩阵:**

```
         1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
    Δ  → [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

**说明**: 依赖关系矩阵无变化，仅在现有文件内部进行功能修改。

---

## 功能影响分析

| 受影响功能 | 影响描述 |
|------------|----------|
| 资源采集 | 修复了判断条件，现在可以正常采集树木、矿石等资源 |
| NPC对话 | 新增API Key配置功能，支持真实的Qwen-turbo对话 |
| 游戏存档 | API Key使用localStorage保存，刷新后不丢失 |

---

## 兼容性说明

- ✅ 向后兼容v1存档
- ✅ 无需修改其他模块
- ✅ 符合版本迭代规则
