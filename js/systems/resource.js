/**
 * 资源采集系统模块 - 二级节点
 * 处理资源生成、采集和消耗
 */

const ResourceSystem = {
    gatherCooldown: 0,
    gatherRange: 60,
    
    init() {
        // 初始化资源系统
    },
    
    update(dt) {
        // 更新采集冷却
        if (this.gatherCooldown > 0) {
            this.gatherCooldown -= dt;
        }
        
        // 更新资源重生
        GameState.resources.forEach(res => {
            if (res.amount <= 0 && res.respawnTime > 0) {
                res.respawnTime -= dt;
                if (res.respawnTime <= 0) {
                    this.respawnResource(res);
                }
            }
        });
    },
    
    gather(resource) {
        if (this.gatherCooldown > 0) {
            Game.showMessage('采集冷却中...');
            return;
        }
        
        const player = GameState.player;
        
        // 消耗体力
        if (player.stamina < 10) {
            Game.showMessage('体力不足，无法采集', 'warning');
            return;
        }
        
        if (resource.amount <= 0) {
            Game.showMessage('资源已耗尽', 'warning');
            return;
        }
        
        const dist = Math.hypot(resource.x - player.x, resource.y - player.y);
        if (dist > this.gatherRange) {
            Game.showMessage('距离太远，无法采集', 'warning');
            return;
        }
        
        player.stamina -= 5;
        
        // 采集
        const gatherAmount = Math.min(resource.amount, 1 + Math.floor(Math.random() * 2));
        resource.amount -= gatherAmount;
        
        // 获取物品
        const item = this.getDropItem(resource.type);
        item.count = gatherAmount;
        
        if (GameState.addItem(player, item)) {
            Game.showMessage(`获得 ${item.name} x${gatherAmount}`, 'success');
        } else {
            Game.showMessage('物品栏已满，物品掉落在地上', 'warning');
            GameState.dropItem(player.x, player.y, item);
        }
        
        // 经验和修炼点
        player.cultivation += 0.5;
        
        // 粒子效果
        GameState.addParticle(resource.x, resource.y, '#88ff88', 8);
        
        // 设置冷却
        this.gatherCooldown = 0.5;
        
        // 检查是否耗尽
        if (resource.amount <= 0) {
            resource.respawnTime = this.getRespawnTime(resource.type);
            Game.showMessage('资源已耗尽，将在一段时间后重生');
        }
    },
    
    getDropItem(resourceType) {
        const drops = {
            tree: { id: 'wood', name: '木材', icon: '🪵', type: 'material', description: '建造材料', value: 5 },
            rock: { id: 'stone', name: '石材', icon: '🪨', type: 'material', description: '建造材料', value: 8 },
            herb: { id: 'herb', name: '灵草', icon: '🌿', type: 'material', description: '炼丹材料', value: 10 },
            spirit_stone: { id: 'spirit_stone', name: '灵石', icon: '💎', type: 'currency', description: '修仙货币', value: 50 },
            water: { id: 'water', name: '清水', icon: '💧', type: 'material', description: '炼丹材料', value: 3 }
        };
        
        return { ...(drops[resourceType] || drops.tree) };
    },
    
    getRespawnTime(resourceType) {
        const times = {
            tree: 60,
            rock: 120,
            herb: 45,
            spirit_stone: 180,
            water: 30
        };
        return times[resourceType] || 60;
    },
    
    respawnResource(resource) {
        const amounts = {
            tree: () => 5 + Math.floor(Math.random() * 10),
            rock: () => 3 + Math.floor(Math.random() * 7),
            herb: () => 1 + Math.floor(Math.random() * 3),
            spirit_stone: () => 1 + Math.floor(Math.random() * 2),
            water: () => 100
        };
        
        resource.amount = amounts[resource.type] ? amounts[resource.type]() : 5;
    },
    
    getResourceByPosition(x, y) {
        for (let res of GameState.resources) {
            const dist = Math.hypot(res.x - x, res.y - y);
            if (dist < res.size) {
                return res;
            }
        }
        return null;
    },
    
    // 获取附近的资源
    getNearbyResources(x, y, range = 100) {
        return GameState.resources.filter(res => {
            const dist = Math.hypot(res.x - x, res.y - y);
            return dist < range && res.amount > 0;
        });
    },
    
    // 自动采集（用于NPC）
    autoGather(npc) {
        const nearby = this.getNearbyResources(npc.x, npc.y, 150);
        if (nearby.length > 0) {
            const target = nearby[0];
            npc.targetX = target.x;
            npc.targetY = target.y;
            
            const dist = Math.hypot(target.x - npc.x, target.y - npc.y);
            if (dist < this.gatherRange) {
                // NPC采集
                if (target.amount > 0) {
                    target.amount--;
                    const item = this.getDropItem(target.type);
                    item.count = 1;
                    GameState.addItem(npc, item);
                }
            }
        }
    }
};
