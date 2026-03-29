/**
 * 功法修炼系统模块 - 二级节点
 * 处理玩家修炼、突破和功法学习
 */

const CultivationSystem = {
    isCultivating: false,
    cultivationTimer: 0,
    breakthroughChance: 0,
    
    init() {
        // 初始化修炼系统
        // 给玩家初始功法
        GameState.player.techniques = ['basic_meditation'];
    },
    
    update(dt) {
        if (this.isCultivating) {
            this.processCultivation(dt);
        }
    },
    
    togglePanel() {
        const panel = document.getElementById('cultivationPanel');
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
            this.stopCultivation();
        } else {
            this.showPanel();
        }
    },
    
    showPanel() {
        const panel = document.getElementById('cultivationPanel');
        const content = document.getElementById('cultivationContent');
        
        const player = GameState.player;
        const realm = GameData.getRealm(player.cultivation);
        
        // 计算下一境界
        const nextRealmIndex = GameData.realms.indexOf(realm) + 1;
        const nextRealm = GameData.realms[nextRealmIndex] || { name: '已至巅峰', minCultivation: Infinity };
        const progress = player.cultivation / nextRealm.minCultivation * 100;
        
        let html = `
            <div style="margin-bottom: 15px;">
                <h3 style="color: #aa88ff;">当前境界: ${player.cultivationRealm}</h3>
                <p>修炼点数: ${Math.floor(player.cultivation)}</p>
                <div style="margin-top: 10px;">
                    <p style="font-size: 12px; color: #aaa;">下一境界: ${nextRealm.name}</p>
                    <div style="background: #2a2a4a; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #aa44ff, #ff44ff); width: ${Math.min(progress, 100)}%; height: 100%;"></div>
                    </div>
                </div>
            </div>
            
            <hr style="border-color: #4a4a8a; margin: 15px 0;">
            
            <h4 style="margin-bottom: 10px;">修炼</h4>
            <p style="font-size: 12px; color: #aaa; margin-bottom: 10px;">
                当前灵力浓度: ${SpiritualSystem.getSpiritualLevel(player.x, player.y).name}
            </p>
            <button class="action-btn" onclick="CultivationSystem.startCultivation()">
                ${this.isCultivating ? '停止修炼' : '开始修炼'}
            </button>
            
            <hr style="border-color: #4a4a8a; margin: 15px 0;">
            
            <h4 style="margin-bottom: 10px;">已学功法</h4>
        `;
        
        player.techniques.forEach(techId => {
            const tech = GameData.techniques.find(t => t.id === techId);
            if (tech) {
                html += `
                    <div style="background: rgba(50,50,80,0.5); padding: 10px; margin-bottom: 8px; border-radius: 5px;">
                        <strong style="color: #aaffaa;">${tech.name}</strong>
                        <p style="font-size: 11px; color: #aaa;">${tech.description}</p>
                        <button class="action-btn" style="font-size: 11px; padding: 5px;" 
                                onclick="CultivationSystem.useTechnique('${tech.id}')">
                            使用
                        </button>
                    </div>
                `;
            }
        });
        
        panel.innerHTML = html;
        panel.classList.add('show');
    },
    
    startCultivation() {
        if (this.isCultivating) {
            this.stopCultivation();
        } else {
            this.isCultivating = true;
            this.cultivationTimer = 0;
            Game.showMessage('开始修炼...', 'info');
            
            // 关闭面板以便看到修炼过程
            document.getElementById('cultivationPanel').classList.remove('show');
        }
    },
    
    stopCultivation() {
        this.isCultivating = false;
        Game.showMessage('停止修炼');
    },
    
    processCultivation(dt) {
        const player = GameState.player;
        
        // 检查法力
        if (player.mana < 5) {
            this.stopCultivation();
            Game.showMessage('法力不足，无法继续修炼', 'warning');
            return;
        }
        
        // 消耗法力
        player.mana -= dt * 2;
        
        // 获取灵力加成
        const spiritualBonus = SpiritualSystem.getSpiritualLevel(player.x, player.y);
        const weatherBonus = WeatherSystem.getSpiritualBonus();
        const factionBonus = FactionSystem.getFactionBonus('cultivation');
        
        // 计算修炼速度
        let speed = player.cultivationSpeed * spiritualBonus.bonus * weatherBonus * factionBonus;
        
        // 检查是否在聚灵阵附近
        for (let building of GameState.buildings) {
            if (building.type === 'training_ground' || building.type === 'spirit_array') {
                const dist = Math.hypot(building.x - player.x, building.y - player.y);
                if (dist < building.width) {
                    speed *= building.effects.cultivation || building.effects.spiritual || 1;
                    break;
                }
            }
        }
        
        // 增加修炼点数
        const gain = dt * speed;
        player.cultivation += gain;
        player.spiritualPower = Math.min(player.maxSpiritualPower, player.spiritualPower + dt * 5);
        
        // 粒子效果
        if (Math.random() < 0.1) {
            GameState.addParticle(
                player.x + (Math.random() - 0.5) * 30,
                player.y + (Math.random() - 0.5) * 30,
                '#aa88ff',
                1
            );
        }
        
        // 检查突破
        this.checkBreakthrough();
    },
    
    checkBreakthrough() {
        const player = GameState.player;
        const currentRealm = GameData.getRealm(player.cultivation);
        
        if (currentRealm.name !== player.cultivationRealm) {
            // 突破成功
            player.cultivationRealm = currentRealm.name;
            player.cultivationLevel = GameData.realms.indexOf(currentRealm) + 1;
            
            // 提升属性
            player.maxHealth += 20;
            player.maxMana += 15;
            player.maxStamina += 10;
            player.attack += 3;
            player.defense += 2;
            
            // 恢复满状态
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            player.stamina = player.maxStamina;
            
            Game.showMessage(`恭喜突破至 ${currentRealm.name}！`, 'success');
            GameState.addParticle(player.x, player.y, '#ff88ff', 30);
            
            this.isCultivating = false;
        }
    },
    
    useTechnique(techId) {
        const tech = GameData.techniques.find(t => t.id === techId);
        if (!tech) return;
        
        const player = GameState.player;
        
        switch(tech.type) {
            case 'cultivation':
                // 修炼类功法，增加修炼速度
                player.cultivationSpeed = 1.5;
                Game.showMessage(`施展 ${tech.name}，修炼速度提升！`);
                setTimeout(() => {
                    player.cultivationSpeed = 1;
                }, 10000);
                break;
                
            case 'healing':
                CombatSystem.healingSkill(tech);
                break;
                
            case 'combat':
                CombatSystem.useSkill(techId);
                break;
                
            case 'movement':
                CombatSystem.movementSkill(tech);
                break;
        }
    },
    
    // 学习新功法
    learnTechnique(techId) {
        const player = GameState.player;
        
        if (player.techniques.includes(techId)) {
            Game.showMessage('已经学会此功法了', 'warning');
            return false;
        }
        
        const tech = GameData.techniques.find(t => t.id === techId);
        if (!tech) {
            Game.showMessage('功法不存在', 'warning');
            return false;
        }
        
        // 检查境界要求
        const realm = GameData.getRealm(player.cultivation);
        const realmIndex = GameData.realms.indexOf(realm);
        
        // 高级功法需要更高境界
        if (tech.power > 1.5 && realmIndex < 2) {
            Game.showMessage('境界不足，无法学习此功法', 'warning');
            return false;
        }
        
        player.techniques.push(techId);
        Game.showMessage(`学会了 ${tech.name}！`, 'success');
        
        return true;
    }
};
