/**
 * 生存系统模块 - 二级节点
 * 处理食物、疾病、免疫力和火源交互
 */

const SurvivalSystem = {
    sickTimer: 0,
    isSick: false,
    sickType: null,
    
    init() {
        // 初始化生存系统
    },
    
    update(dt) {
        // 更新饥饿值
        this.updateHunger(dt);
        
        // 更新疾病状态
        this.updateSickness(dt);
        
        // 更新免疫力
        this.updateImmunity(dt);
    },
    
    updateHunger(dt) {
        const player = GameState.player;
        
        // 饥饿值缓慢下降
        player.hunger = Math.max(0, player.hunger - dt * 0.3);
        
        // 饥饿效果
        if (player.hunger <= 0) {
            // 饥饿状态：持续掉血
            player.health = Math.max(0, player.health - dt * 1);
            
            // 降低体力恢复
            player.stamina = Math.max(0, player.stamina - dt * 0.5);
        } else if (player.hunger <= 20) {
            // 饥饿警告
            player.stamina = Math.min(player.maxStamina, player.stamina + dt * 2);
        } else {
            // 正常恢复
            player.stamina = Math.min(player.maxStamina, player.stamina + dt * 5);
        }
    },
    
    updateSickness(dt) {
        const player = GameState.player;
        
        if (this.isSick) {
            this.sickTimer -= dt;
            
            // 疾病效果
            switch(this.sickType) {
                case 'food_poisoning':
                    // 食物中毒：持续掉血和体力
                    player.health = Math.max(0, player.health - dt * 2);
                    player.stamina = Math.max(0, player.stamina - dt * 3);
                    player.immunity = Math.max(0, player.immunity - dt * 0.5);
                    break;
                    
                case 'cold':
                    // 感冒：降低体力恢复和移动速度
                    player.speed = 2;
                    break;
                    
                case 'spiritual_imbalance':
                    // 灵气紊乱：法力流失
                    player.mana = Math.max(0, player.mana - dt * 5);
                    break;
            }
            
            // 疾病自然恢复
            if (this.sickTimer <= 0 || player.immunity >= 80) {
                this.cure();
            }
        } else {
            // 恢复正常速度
            const baseSpeed = GameState.player.baseSpeed || 3;
            if (player.speed !== baseSpeed && !player.speedBoosted) {
                player.speed = baseSpeed;
            }
        }
    },
    
    updateImmunity(dt) {
        const player = GameState.player;
        
        // 免疫力自然恢复（缓慢）
        player.immunity = Math.min(player.maxImmunity, player.immunity + dt * 0.1);
        
        // 天气影响免疫力
        if (WeatherSystem.temperature < 0) {
            player.immunity = Math.max(0, player.immunity - dt * 0.5);
        }
        
        // 火源附近恢复免疫力
        const fire = BuildingSystem.getNearbyFireSource(player.x, player.y);
        if (fire) {
            player.immunity = Math.min(player.maxImmunity, player.immunity + dt * 2);
        }
    },
    
    eat() {
        const player = GameState.player;
        
        // 查找食物
        const foodSlot = player.inventory.findIndex(item => 
            item && (item.type === 'food' || item.type === 'medicine')
        );
        
        if (foodSlot === -1) {
            Game.showMessage('没有可吃的食物', 'warning');
            return;
        }
        
        const item = player.inventory[foodSlot];
        this.eatItem(item, foodSlot);
    },
    
    eatItem(item, slotIndex) {
        const player = GameState.player;
        
        // 检查是否是生肉
        if (item.isRaw) {
            // 吃生肉有风险
            if (Math.random() < 0.6 - player.immunity / 200) {
                this.contractSickness('food_poisoning');
                Game.showMessage('吃了生肉，感觉不舒服...', 'danger');
            }
            
            // 生肉回复少量饥饿值
            player.hunger = Math.min(player.maxHunger, player.hunger + 15);
        } else if (item.type === 'food') {
            // 正常食物
            player.hunger = Math.min(player.maxHunger, player.hunger + (item.hunger || 20));
            
            if (item.heal) {
                player.health = Math.min(player.maxHealth, player.health + item.heal);
            }
            
            Game.showMessage(`吃了 ${item.name}，恢复体力`, 'success');
        } else if (item.type === 'medicine') {
            // 药品
            if (item.heal) {
                player.health = Math.min(player.maxHealth, player.health + item.heal);
            }
            if (item.cultivation) {
                player.cultivation += item.cultivation;
            }
            if (item.id === 'pill_immunity') {
                player.immunity = Math.min(player.maxImmunity, player.immunity + 30);
            }
            
            Game.showMessage(`使用了 ${item.name}`, 'success');
        }
        
        // 消耗物品
        GameState.removeItem(player, item.id, 1);
        
        // 粒子效果
        GameState.addParticle(player.x, player.y, '#88ff88', 8);
    },
    
    cook() {
        const player = GameState.player;
        
        // 检查火源
        const fire = BuildingSystem.getNearbyFireSource(player.x, player.y);
        if (!fire) {
            Game.showMessage('需要在火源附近才能烹饪！', 'warning');
            return;
        }
        
        // 检查生肉
        if (!GameState.hasItem(player, 'raw_meat', 1)) {
            Game.showMessage('没有生肉可以烹饪', 'warning');
            return;
        }
        
        // 烹饪
        GameState.removeItem(player, 'raw_meat', 1);
        
        const cookedMeat = { ...GameData.items.cooked_meat, count: 1 };
        GameState.addItem(player, cookedMeat);
        
        Game.showMessage('烹饪成功！获得熟肉', 'success');
        GameState.addParticle(player.x, player.y - 20, '#ffaa44', 10);
    },
    
    useMedicine(item, slotIndex) {
        const player = GameState.player;
        
        if (item.heal) {
            player.health = Math.min(player.maxHealth, player.health + item.heal);
        }
        
        if (item.cultivation) {
            player.cultivation += item.cultivation;
        }
        
        if (item.id === 'pill_immunity') {
            player.immunity = Math.min(player.maxImmunity, player.immunity + 30);
        }
        
        // 某些丹药可以治愈疾病
        if (item.id === 'pill_healing' && this.isSick) {
            this.cure();
        }
        
        GameState.removeItem(player, item.id, 1);
        Game.showMessage(`使用了 ${item.name}`, 'success');
    },
    
    contractSickness(type) {
        this.isSick = true;
        this.sickType = type;
        
        switch(type) {
            case 'food_poisoning':
                this.sickTimer = 30; // 30秒
                Game.showMessage('食物中毒！', 'danger');
                break;
            case 'cold':
                this.sickTimer = 60;
                Game.showMessage('感冒了！移动速度降低', 'warning');
                break;
            case 'spiritual_imbalance':
                this.sickTimer = 45;
                Game.showMessage('灵气紊乱！法力流失', 'danger');
                break;
        }
        
        // 降低免疫力
        GameState.player.immunity = Math.max(0, GameState.player.immunity - 20);
    },
    
    cure() {
        if (!this.isSick) return;
        
        this.isSick = false;
        this.sickType = null;
        this.sickTimer = 0;
        
        GameState.player.speed = 3;
        Game.showMessage('疾病已痊愈', 'success');
    },
    
    // 休息恢复
    rest() {
        const player = GameState.player;
        
        // 检查是否在住所附近
        let restBonus = 1;
        
        for (let building of GameState.buildings) {
            if (building.type === 'house') {
                const dist = Math.hypot(building.x - player.x, building.y - player.y);
                if (dist < building.width) {
                    restBonus = building.effects.rest || 1.5;
                    break;
                }
            }
        }
        
        // 恢复生命和体力
        player.health = Math.min(player.maxHealth, player.health + 10 * restBonus);
        player.stamina = Math.min(player.maxStamina, player.stamina + 20 * restBonus);
        player.mana = Math.min(player.maxMana, player.mana + 15 * restBonus);
        
        Game.showMessage(`休息中...恢复效果 x${restBonus}`);
    },
    
    // 获取生存状态描述
    getStatus() {
        const player = GameState.player;
        const statusList = [];
        
        if (player.hunger <= 20) statusList.push('饥饿');
        if (player.immunity <= 30) statusList.push('虚弱');
        if (this.isSick) statusList.push('生病');
        if (player.stamina <= 20) statusList.push('疲惫');
        if (player.health <= 30) statusList.push('受伤');
        
        return statusList.length > 0 ? statusList.join(', ') : '正常';
    }
};
