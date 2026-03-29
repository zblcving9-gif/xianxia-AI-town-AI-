/**
 * 灵力系统模块 - 二级节点
 * 管理地图灵力分布和对修炼的影响
 */

const SpiritualSystem = {
    // 灵力等级定义
    levels: [
        { name: '贫瘠', minLevel: 0, bonus: 0.5, color: '#888888' },
        { name: '稀薄', minLevel: 0.5, bonus: 1.0, color: '#aaaaaa' },
        { name: '普通', minLevel: 1, bonus: 1.2, color: '#88cc88' },
        { name: '充裕', minLevel: 1.5, bonus: 1.5, color: '#88aaff' },
        { name: '浓郁', minLevel: 2, bonus: 2.0, color: '#aa88ff' },
        { name: '灵地', minLevel: 2.5, bonus: 2.5, color: '#ff88ff' },
        { name: '洞天福地', minLevel: 3, bonus: 3.5, color: '#ffaa00' },
        { name: '仙家圣地', minLevel: 4, bonus: 5.0, color: '#ffff00' }
    ],
    
    // 噪声缓存
    noiseCache: new Map(),
    
    init() {
        // 生成噪声缓存
        this.generateNoiseCache();
    },
    
    update(dt) {
        // 灵力会随时间轻微波动
        // 这里可以添加动态灵力变化逻辑
    },
    
    generateNoiseCache() {
        // 使用简单的柏林噪声模拟
        const scale = 0.005;
        for (let x = 0; x <= 3000; x += 50) {
            for (let y = 0; y <= 2000; y += 50) {
                const key = `${x},${y}`;
                // 使用多个正弦波叠加模拟噪声
                const noise = 
                    Math.sin(x * scale) * Math.cos(y * scale) * 0.5 +
                    Math.sin(x * scale * 2.3 + 1) * Math.cos(y * scale * 1.7 + 2) * 0.3 +
                    Math.sin(x * scale * 0.7 + 3) * Math.cos(y * scale * 0.9 + 4) * 0.2;
                
                this.noiseCache.set(key, (noise + 1) / 2); // 归一化到 0-1
            }
        }
    },
    
    // 获取指定位置的灵力等级
    getSpiritualLevel(x, y) {
        // 基础灵力（来自噪声）
        const baseLevel = this.getBaseSpiritual(x, y);
        
        // 检查灵力区域加成
        let areaBonus = 0;
        for (const area of GameState.spiritualAreas) {
            const dist = Math.hypot(area.x - x, area.y - y);
            if (dist < area.radius) {
                // 距离中心越近，加成越高
                const factor = 1 - dist / area.radius;
                areaBonus = Math.max(areaBonus, area.level * factor);
            }
        }
        
        // 建筑加成（聚灵阵）
        for (const building of GameState.buildings) {
            if (building.type === 'spirit_array') {
                const dist = Math.hypot(building.x - x, building.y - y);
                if (dist < building.width / 2) {
                    areaBonus = Math.max(areaBonus, 3);
                }
            }
        }
        
        const totalLevel = baseLevel + areaBonus;
        
        // 找到对应的等级描述
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (totalLevel >= this.levels[i].minLevel) {
                return {
                    ...this.levels[i],
                    level: totalLevel
                };
            }
        }
        
        return this.levels[0];
    },
    
    getBaseSpiritual(x, y) {
        const key = `${Math.floor(x / 50) * 50},${Math.floor(y / 50) * 50}`;
        const cached = this.noiseCache.get(key);
        
        if (cached !== undefined) {
            return cached * 1.5; // 基础范围 0-1.5
        }
        
        // 如果没有缓存，计算近似值
        const scale = 0.005;
        const noise = 
            Math.sin(x * scale) * Math.cos(y * scale) * 0.5 +
            Math.sin(x * scale * 2.3 + 1) * Math.cos(y * scale * 1.7 + 2) * 0.3;
        
        return (noise + 1) / 2 * 1.5;
    },
    
    // 获取修炼加成（综合考虑多个因素）
    getCultivationBonus(x, y) {
        const spiritual = this.getSpiritualLevel(x, y);
        const weather = WeatherSystem.getSpiritualBonus();
        
        return spiritual.bonus * weather;
    },
    
    // 消耗灵力（用于法术等）
    consumeSpiritualPower(amount) {
        const player = GameState.player;
        
        if (player.spiritualPower < amount) {
            return false;
        }
        
        player.spiritualPower -= amount;
        return true;
    },
    
    // 灵力攻击（灵力高的地方攻击更强）
    getSpiritualAttackBonus(x, y) {
        const level = this.getSpiritualLevel(x, y);
        return 1 + (level.level - 1) * 0.1;
    },
    
    // 灵力防御（灵力高的地方防御更强）
    getSpiritualDefenseBonus(x, y) {
        const level = this.getSpiritualLevel(x, y);
        return 1 + (level.level - 1) * 0.05;
    },
    
    // 灵力对体力恢复的影响
    getSpiritualStaminaRecovery(x, y) {
        const level = this.getSpiritualLevel(x, y);
        return level.bonus;
    },
    
    // 寻找附近灵力最高的位置
    findBestCultivationSpot(centerX, centerY, range = 200) {
        let bestSpot = { x: centerX, y: centerY, level: 0 };
        
        for (let x = centerX - range; x <= centerX + range; x += 20) {
            for (let y = centerY - range; y <= centerY + range; y += 20) {
                const level = this.getSpiritualLevel(x, y);
                if (level.level > bestSpot.level) {
                    bestSpot = { x, y, level: level.level };
                }
            }
        }
        
        return bestSpot;
    },
    
    // 灵力波动（某些事件会暂时改变局部灵力）
    createSpiritualFluctuation(x, y, radius, intensity, duration) {
        // 添加临时灵力区域
        const fluctuation = {
            x, y, radius, intensity,
            duration,
            isFluctuation: true
        };
        
        GameState.spiritualAreas.push(fluctuation);
        
        // 定时移除
        setTimeout(() => {
            const index = GameState.spiritualAreas.indexOf(fluctuation);
            if (index !== -1) {
                GameState.spiritualAreas.splice(index, 1);
            }
        }, duration * 1000);
    },
    
    // 灵气爆发事件
    triggerSpiritualBurst() {
        // 随机位置
        const x = Math.random() * 2800 + 100;
        const y = Math.random() * 1800 + 100;
        
        // 创建高灵力区域
        this.createSpiritualFluctuation(x, y, 200, 4, 60);
        
        Game.showMessage(`灵气爆发！位置: (${Math.floor(x)}, ${Math.floor(y)})`, 'success');
        
        // 粒子效果
        GameState.addParticle(x, y, '#ffff88', 30);
    },
    
    // 获取灵力对战斗的影响
    getSpiritualCombatEffects(x, y) {
        const level = this.getSpiritualLevel(x, y);
        
        return {
            attackBonus: 1 + (level.level - 1) * 0.1,
            defenseBonus: 1 + (level.level - 1) * 0.05,
            manaRecovery: level.bonus,
            description: `灵力${level.name}：攻击+${Math.round((level.level - 1) * 10)}%, 防御+${Math.round((level.level - 1) * 5)}%`
        };
    }
};
